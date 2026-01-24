
// Tutorial Logic using driver.js

window.initTutorial = function () {
    // Check if driver is loaded
    if (!window.driver || !window.driver.js) {
        console.error('Driver.js is not loaded');
        return null;
    }

    const driver = window.driver.js.driver;

    const driverObj = driver({
        showProgress: true,
        allowClose: true,
        // Customize text for Japanese users
        nextBtnText: '次へ',
        prevBtnText: '戻る',
        doneBtnText: '完了',
        progressText: '{{current}} / {{total}}',
        steps: [
            {
                element: '.header-overlay',
                popover: {
                    title: 'SISMIC JPへようこそ',
                    description: '日本周辺の地震活動を可視化するインタラクティブマップです。<br>このガイドでは主な機能を紹介します。'
                }
            },
            {
                element: '#map',
                popover: {
                    title: 'マップ表示エリア',
                    description: 'ここに地震が円として描画されます。<br>・<span style="color:#00a8cc">青</span>: M2.5-5 (小規模)<br>・<span style="color:#ff9900">黄</span>: M5-6 (中規模)<br>・<span style="color:#e51c23">赤</span>: M6+ (大規模)'
                }
            },
            {
                element: '.year-tabs-overlay',
                popover: {
                    title: 'データの切り替え',
                    description: '「直近1年」や過去の年代（2011年〜）を選択してデータを切り替えます。<br>まずは気になる年代を選んでみましょう。'
                }
            },
            {
                element: '.controls-overlay',
                popover: {
                    title: '再生コントロール',
                    description: '再生ボタン▶でアニメーションを開始します。<br>スライダーを動かすことで、任意の時点にジャンプできます。'
                }
            },
            {
                element: '.stats-container',
                popover: {
                    title: '統計データ',
                    description: '選択された期間内の地震総数と、その中の最大マグニチュードが表示されます。'
                }
            },
            {
                element: '#relief-toggle',
                popover: {
                    title: '地形図モード',
                    description: 'このボタンで地形図（陰影起伏図）のオン/オフができます。<br>海溝や山脈などの地形と地震の関係を見るのに便利です。'
                }
            },
            {
                element: '#tutorial-toggle',
                popover: {
                    title: 'いつでも確認できます',
                    description: '使い方が分からなくなったら、このボタンを押して再度ガイドを見ることができます。'
                }
            }
        ]
    });

    return driverObj;
};

window.startTutorial = function () {
    const driverObj = window.initTutorial();
    if (driverObj) {
        driverObj.drive();
    }
};

window.checkFirstVisit = function () {
    const hasSeenTutorial = localStorage.getItem('sismic_tutorial_seen');
    if (!hasSeenTutorial) {
        // Delay slightly to ensure map is loaded
        setTimeout(() => {
            window.startTutorial();
            localStorage.setItem('sismic_tutorial_seen', 'true');
        }, 1500);
    }
};
