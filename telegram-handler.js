const TELEGRAM_BOT_TOKEN = '7866943018:AAG2aHJ6dbeAaMEqDrnZP8U1VtHfC1O2_cY';

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
            const data = await response.json();

            if (data.ok && data.result.length > 0) {
                for (const update of data.result) {
                    this.lastUpdateId = update.update_id;

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
        console.log('تم الضغط على زر:', callbackData);

        try {

            await this.answerCallbackQuery(callbackQuery.id);

            if (callbackData.startsWith('order_completed_')) {
                const userId = callbackData.replace('order_completed_', '');
                await this.handleOrderCompleted(userId, message);
            } else if (callbackData.startsWith('order_failed_')) {
                const userId = callbackData.replace('order_failed_', '');
                await this.handleOrderFailed(userId, message);
            }
        } catch (error) {
            console.error('خطأ في معالجة ضغطة الزر:', error);
        }
    }

    async handleOrderCompleted(userId, message) {
        try {

            const newText = message.text + '\n\n✅ تم تأكيد الطلب وتم إضافة نقطة للعميل';

            await this.editMessage(message.chat.id, message.message_id, newText);


            if (window.updateUserCompletedOrders) {
                await window.updateUserCompletedOrders(userId);
            }
            console.log(`تم تأكيد الطلب للمستخدم: ${userId}`);

            await this.sendMessage(message.chat.id, `✅ تم تأكيد الطلب للمستخدم: ${userId}\nتم إضافة نقطة إلى حساب العميل.`);

        } catch (error) {
            console.error('خطأ في تأكيد الطلب:', error);
        }
    }

    async handleOrderFailed(userId, message) {
        try {

            const newText = message.text + '\n\n❌ تم رفض الطلب';

            await this.editMessage(message.chat.id, message.message_id, newText);

            console.log(`تم رفض الطلب للمستخدم: ${userId}`);


            await this.sendMessage(message.chat.id, `❌ تم رفض الطلب للمستخدم: ${userId}`);

        } catch (error) {
            console.error('خطأ في رفض الطلب:', error);
        }
    }

    async answerCallbackQuery(callbackQueryId, text = 'تم تسجيل اختيارك') {
        try {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    callback_query_id: callbackQueryId,
                    text: text,
                    show_alert: false
                })
            });
        } catch (error) {
            console.error('خطأ في الرد على الزر:', error);
        }
    }

    async editMessage(chatId, messageId, newText) {
        try {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageId,
                    text: newText,
                    parse_mode: 'Markdown'
                })
            });
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
