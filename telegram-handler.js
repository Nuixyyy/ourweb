const TELEGRAM_BOT_TOKEN = '7866943018:AAG2aHJ6dbeAaMEqDrnZP8U1VtHfC1O2_cY';
const TELEGRAM_GROUP_CHAT_ID = '-1002744803377'; // ضع هنا ID الكروب

class TelegramHandler {
    constructor() {
        this.lastUpdateId = 0;
        this.polling = false;
    }

    async startPolling() {
        if (this.polling) return;
        this.polling = true;
        console.log('بدء مراقبة أزرار التليجرام...');

        while (this.polling) {
            try {
                await this.checkForUpdates();
                await this.sleep(2000); 
            } catch (error) {
                console.error('خطأ في مراقبة التليجرام:', error);
                await this.sleep(5000); // انتظار أطول في حالة الخطأ
            }
        }
    }

    async checkForUpdates() {
        try {
            const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=1`);
            
            if (!response.ok) {
                console.error('خطأ في الاتصال بـ Telegram API:', response.status, response.statusText);
                return;
            }
            
            const data = await response.json();

            if (data.ok && data.result.length > 0) {
                for (const update of data.result) {
                    this.lastUpdateId = update.update_id;
                    console.log('تحديث جديد:', update);

                    if (update.callback_query) {
                        await this.handleButtonClick(update.callback_query);
                    }
                }
            }
        } catch (error) {
            console.error('خطأ في فحص تحديثات التليجرام:', error);
        }
    }

    async handleButtonClick(callbackQuery) {
        const { data: callbackData, message, from } = callbackQuery;
        console.log('تم الضغط على زر:', callbackData, 'من المستخدم:', from.first_name);

        try {
            // الرد على الاستعلام أولاً لإزالة حالة التحميل
            await this.answerCallbackQuery(callbackQuery.id, 'جاري المعالجة...');

            if (callbackData.startsWith('order_completed_')) {
                const userId = callbackData.replace('order_completed_', '');
                console.log('معالجة تأكيد الطلب للمستخدم:', userId);
                await this.handleOrderCompleted(userId, message);
            } else if (callbackData.startsWith('order_failed_')) {
                const userId = callbackData.replace('order_failed_', '');
                console.log('معالجة رفض الطلب للمستخدم:', userId);
                await this.handleOrderFailed(userId, message);
            } else {
                console.log('نوع زر غير معروف:', callbackData);
                await this.answerCallbackQuery(callbackQuery.id, 'نوع طلب غير معروف');
            }
        } catch (error) {
            console.error('خطأ في معالجة ضغطة الزر:', error);
            await this.answerCallbackQuery(callbackQuery.id, 'حدث خطأ أثناء المعالجة');
        }
    }

    async handleOrderCompleted(userId, message) {
        try {
            // تعديل الرسالة الأصلية لإزالة الأزرار وإضافة حالة التأكيد
            const newText = message.text + '\n\n✅ تم تأكيد الطلب وتم إضافة نقطة للعميل';

            await this.editMessage(message.chat.id, message.message_id, newText, null);

            // تحديث بيانات المستخدم إذا كانت الدالة متوفرة
            if (window.updateUserCompletedOrders) {
                await window.updateUserCompletedOrders(userId);
            }
            
            console.log(`تم تأكيد الطلب للمستخدم: ${userId}`);

            // إرسال رسالة تأكيد منفصلة للكروب
            await this.sendMessage(TELEGRAM_GROUP_CHAT_ID, `✅ تم تأكيد الطلب للمستخدم: ${userId}\nتم إضافة نقطة إلى حساب العميل.`);

        } catch (error) {
            console.error('خطأ في تأكيد الطلب:', error);
        }
    }

    async handleOrderFailed(userId, message) {
        try {
            // تعديل الرسالة الأصلية لإزالة الأزرار وإضافة حالة الرفض
            const newText = message.text + '\n\n❌ تم رفض الطلب';

            await this.editMessage(message.chat.id, message.message_id, newText, null);

            console.log(`تم رفض الطلب للمستخدم: ${userId}`);

            // إرسال رسالة رفض منفصلة للكروب
            await this.sendMessage(TELEGRAM_GROUP_CHAT_ID, `❌ تم رفض الطلب للمستخدم: ${userId}`);

        } catch (error) {
            console.error('خطأ في رفض الطلب:', error);
        }
    }

    async answerCallbackQuery(callbackQueryId, text = 'تم تسجيل اختيارك') {
        try {
            const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    callback_query_id: callbackQueryId,
                    text: text,
                    show_alert: false
                })
            });

            const result = await response.json();
            if (!result.ok) {
                console.error('فشل في الرد على الزر:', result);
            } else {
                console.log('تم الرد على الزر بنجاح:', text);
            }
        } catch (error) {
            console.error('خطأ في الرد على الزر:', error);
        }
    }

    async editMessage(chatId, messageId, newText, replyMarkup = undefined) {
        try {
            const payload = {
                chat_id: chatId,
                message_id: messageId,
                text: newText,
                parse_mode: 'Markdown'
            };

            // إذا تم تمرير null، نزيل الأزرار
            if (replyMarkup === null) {
                payload.reply_markup = { inline_keyboard: [] };
            } else if (replyMarkup) {
                payload.reply_markup = replyMarkup;
            }

            const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (!result.ok) {
                console.error('فشل في تعديل الرسالة:', result);
            } else {
                console.log('تم تعديل الرسالة بنجاح');
            }
        } catch (error) {
            console.error('خطأ في تعديل الرسالة:', error);
        }
    }

    async sendMessage(chatId, text) {
        try {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'Markdown'
                })
            });
        } catch (error) {
            console.error('خطأ في إرسال الرسالة:', error);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    stopPolling() {
        this.polling = false;
        console.log('تم إيقاف مراقبة أزرار التليجرام');
    }
}


window.TelegramHandler = TelegramHandler;
