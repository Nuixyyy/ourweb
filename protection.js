// ملف حماية إضافي
(function() {
    'use strict';

    // تشويش console
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = function() { return; };
    console.warn = function() { return; };
    console.error = function() { return; };
    console.clear = function() { return; };
    console.dir = function() { return; };
    console.dirxml = function() { return; };
    console.table = function() { return; };
    console.trace = function() { return; };
    console.assert = function() { return; };

    // تعطيل الكونسول بدلاً من منعه
    if (typeof console !== 'undefined') {
        console.log = console.warn = console.error = console.info = console.debug = function() {};
    }

    // كشف محاولات تجاوز الحماية
    let attempts = 0;
    const maxAttempts = 3;

    function logAttempt() {
        attempts++;
        if (attempts >= maxAttempts) {
            window.location.href = 'about:blank';
        }
    }

    // مراقبة محاولات فتح أدوات المطور
    let devToolsChecker = function() {
        let start = new Date();
        debugger;
        let end = new Date();
        if (end - start > 100) {
            logAttempt();
            document.body.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;z-index:99999;">🚫 تم اكتشاف أدوات المطور</div>';
        }
    };

    setInterval(devToolsChecker, 1000);

    // منع shortcuts إضافية
    document.addEventListener('keydown', function(e) {
        // منع Ctrl+A (تحديد الكل)
        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            return false;
        }

        // منع Ctrl+S (حفظ الصفحة)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            return false;
        }

        // منع Ctrl+P (طباعة)
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            return false;
        }
    });

    // منع drag and drop
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });

    // كشف محاولات تشغيل كود في console
    window.addEventListener('error', function(e) {
        logAttempt();
    });

})();
