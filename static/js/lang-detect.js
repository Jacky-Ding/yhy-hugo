// lang-detect.js — Redirect root `/` to best language, with loop guard
(function() {
    // Guard: only run on the root path `/`
    if (window.location.pathname !== '/') return;

    // Guard: prevent redirect loops (if already redirected, another script execution won't help)
    var redirected = sessionStorage.getItem('yhy_redirected');
    if (redirected === '1') return;

    var supported = ['zh', 'en', 'ru'];
    var savedLang = localStorage.getItem('yhy_lang');

    function redirectTo(lang) {
        if (supported.indexOf(lang) === -1) lang = 'en';
        sessionStorage.setItem('yhy_redirected', '1');
        localStorage.setItem('yhy_lang', lang);
        window.location.replace('/' + lang + '/');
    }

    if (savedLang && supported.indexOf(savedLang) !== -1) {
        redirectTo(savedLang);
        return;
    }

    // Use browser language as primary detection
    var browserLang = navigator.language || navigator.userLanguage || '';
    var lang = 'en';
    if (browserLang.indexOf('zh') === 0) lang = 'zh';
    else if (browserLang.indexOf('ru') === 0) lang = 'ru';
    redirectTo(lang);
})();
