var canvas;
var context;
var gameLoopTimer;
var curPosX = 0;
var curPosY = 0;
var mouseState = -1;
var hndl;
var playerName = "";
var gameState = 0;
var gameScore = 0;
var playBgm = undefined;
var KEY_USE = ['f', 'j'];
var isKeyDown = {};
var GAME_BREAK = -1;
var GAME_PLAYING = 0;
var GAME_OVER = 1;
var ROUGH_SCALE = 3;
var ROUGH_WIDTH = 416;
var ROUGH_HEIGHT = 240;
var SCREEN_WIDTH = ROUGH_SCALE * ROUGH_WIDTH;
var SCREEN_HEIGHT = ROUGH_SCALE * ROUGH_HEIGHT;
var COL_FIRE = 1 << 0;
//let socket = new WebSocket('ws://127.0.0.1:5003');
var socket = new WebSocket('ws://49.212.155.232:5003');
var isSocketConnect = false;
window.onload = function () {
    canvas = document.getElementById("canvas1");
    if (canvas.getContext) {
        context = canvas.getContext("2d");
        context.imageSmoothingEnabled = this.checked;
        context.mozImageSmoothingEnabled = this.checked;
        context.webkitImageSmoothingEnabled = this.checked;
        context.msImageSmoothingEnabled = this.checked;
        Sprite.init();
        hndl = new Handler();
        SceneChage.init();
        SceneChage.toTitle();
        document.onmousemove = onMouseMove; // マウス移動ハンドラ
        document.onmouseup = onMouseUp; // マウスアップハンドラ
        document.onmousedown = onMouseDown; // マウスダウンハンドラ
        onKeyInit();
        document.addEventListener("keypress", onKeyDown); //キーボード入力
        document.addEventListener("keyup", onKeyUp);
    }
};
// 接続
socket.addEventListener('open', function (e) {
    isSocketConnect = true;
    console.log('Socket connection succeeded');
    scoresWrite();
});
socket.addEventListener('message', function (e) {
    var d = e.data + "";
    console.log("received: " + d);
    var dat = d.split(',');
    var s = "<div class=\"center\">[ SCORE RANKING ]<br></div>";
    var size = 16;
    for (var i = 0; i < size; i++) {
        var n = (i + 1) + "";
        s += "<span class=\"rankorder\">" + n.padStart(2, '0') + "</span>";
        s += "<span class=\"rankname\">" + (dat[size + i] == "" ? "ANONYMOUS" : dat[size + i]) + "</span>";
        s += "<span class=\"score-number\">" + dat[i] + "</span><br>";
    }
    var par1 = document.getElementById("scores");
    par1.innerHTML = s;
    var par2 = document.getElementById("plays");
    par2.innerHTML = "\u3053\u306E\u30B2\u30FC\u30E0\u306F\u8A08 " + dat[size * 2] + " \u56DE\u30D7\u30EC\u30A4\u3055\u308C\u307E\u3057\u305F";
});
function checkForm($this) {
    var str = $this.value;
    while (str.match(/[^A-Z^a-z\d\-\_]/)) {
        str = str.replace(/[^A-Z^a-z\d\-\_]/, "");
    }
    $this.value = str.toUpperCase().substr(0, 16);
    playerName = $this.value;
}
function onMouseMove(e) {
    curPosX = e.clientX;
    curPosY = e.clientY;
    var pos = clientToCanvas(canvas, curPosX, curPosY);
    curPosX = pos.x;
    curPosY = pos.y;
}
function onKeyInit() {
    for (var i = 0; i < KEY_USE.length; i++) {
        isKeyDown[KEY_USE[i]] = false;
    }
}
function onKeyDown(e) {
    //console.log(e.key);
    for (var i = 0; i < KEY_USE.length; i++) {
        var c = KEY_USE[i];
        if (e.key === c || e.key === c.toUpperCase()) {
            isKeyDown[c] = true;
        }
    }
}
function onKeyUp(e) {
    for (var i = 0; i < KEY_USE.length; i++) {
        var c = KEY_USE[i];
        if (e.key === c || e.key === c.toUpperCase()) {
            isKeyDown[c] = false;
        }
    }
}
function onMouseKey(e) {
    mouseState = -1;
}
function onMouseDown(e) {
    mouseState = e.button;
}
function onMouseUp(e) {
    mouseState = -1;
}
function clientToCanvas(canvas, clientX, clientY) {
    var cx = clientX - canvas.offsetLeft + document.body.scrollLeft;
    var cy = clientY - canvas.offsetTop + document.body.scrollTop;
    //console.log(clientY , canvas.offsetTop , document.body.scrollTop);
    var ret = {
        x: cx,
        y: cy
    };
    return ret;
}
var Handler = /** @class */ (function () {
    function Handler() {
        this.back = Graph.loadGraph("./images/backDarkGreen--416x240.png");
        this.explode = Graph.loadGraph("./images/explode--32.png");
        this.star = Graph.loadGraph("./images/stars--24.png");
        this.matrixText = Graph.loadGraph("./images/matrixText--16x128.png");
        this.turtle = Graph.loadGraph("./images/hornTurtle--32.png");
        this.atField = Graph.loadGraph("./images/atField--4x48.png");
        this.ball = Graph.loadGraph("./images/greenBall--16.png");
    }
    ;
    ;
    return Handler;
}());
var SceneChage = /** @class */ (function () {
    function SceneChage() {
    }
    SceneChage.init = function () {
        gameLoopTimer = setInterval(function () { }, 16);
        new BackDarkGreen();
        new MatrxTextGenerator();
    };
    SceneChage.toMain = function () {
        clearInterval(gameLoopTimer);
        Main.set();
        gameLoopTimer = setInterval(Main.loop, 16);
    };
    SceneChage.toTitle = function () {
        clearInterval(gameLoopTimer);
        Title.set();
        gameLoopTimer = setInterval(Title.loop, 16);
    };
    return SceneChage;
}());
//タイトル
var Title = /** @class */ (function () {
    function Title() {
    }
    Title.set = function () {
        new TitleUi();
        gameState = GAME_BREAK;
    };
    Title.loop = function () {
        Sprite.allUpdate();
        Sprite.allDrawing();
        if (mouseState == 0 && Useful.between(curPosX + window.pageXOffset, 0, SCREEN_WIDTH) && Useful.between(curPosY + window.pageYOffset, 0, SCREEN_HEIGHT)) {
            Sprite.allClear(true);
            //Sound.playSoundFile("./sounds/startPush.mp3");
            SceneChage.toMain();
        }
    };
    return Title;
}());
var TitleUi = /** @class */ (function () {
    function TitleUi() {
        var sp = Sprite.set();
        Sprite.belong(sp, this);
        Sprite.DrawingProcess(sp, this.drawing);
        Sprite.offset(sp, 0, 0, -4096);
        Useful.drawStringInit();
    }
    TitleUi.prototype.drawing = function (x, y) {
        UiTexts.baseText();
        Useful.drawStringEdged(112 * ROUGH_SCALE, SCREEN_HEIGHT / 2 - 24, "LEFT CLICK TO START THE GAME");
    };
    return TitleUi;
}());
//ページ内にスコアランキングを表示する
function scoresWrite() {
    var send = "";
    send += gameScore.toString() + ",";
    send += playerName;
    if (isSocketConnect)
        socket.send(send);
}
//メインループ
var Main = /** @class */ (function () {
    function Main() {
    }
    Main.set = function () {
        Player.set();
        new BallGenerator();
        new UiTexts();
        new Cardinal();
        gameState = GAME_PLAYING;
        gameScore = 0;
        Main.count = 0;
        Main.finishCount = 0;
        playBgm = Sound.playSoundFile("./sounds/environment.mp3", 0.2, true);
    };
    Main.loop = function () {
        context.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        Sprite.allUpdate();
        Sprite.allDrawing();
        Main.count++;
        switch (gameState) {
            case GAME_PLAYING:
                {
                    if (Main.count % 12 == 0)
                        gameScore++;
                    break;
                }
            case GAME_OVER:
                {
                    Main.finishCount++;
                    if (Main.finishCount > 60 * 4) {
                        scoresWrite();
                        Sprite.allClear(true);
                        playBgm.pause();
                        SceneChage.toTitle();
                        return;
                    }
                    break;
                }
        }
    };
    Main.count = 0;
    Main.finishCount = 0;
    Main.level = 1;
    return Main;
}());
///プレイヤー
var Player = /** @class */ (function () {
    function Player(side) {
        var sp = Sprite.set();
        var cls = this;
        cls.x = Player.getX(side);
        cls.y = 0;
        cls.count = 0;
        cls.side = side;
        Sprite.belong(sp, cls);
        Sprite.update(sp, cls.update);
        new AtField(sp, side);
    }
    Player.prototype.update = function () {
        var sp = Sprite.callIndex;
        var cls = Sprite.belong(sp);
        cls.y = (curPosY + window.pageYOffset) / ROUGH_SCALE - 16;
        Sprite.offset(sp, cls.x, cls.y, -100);
        {
            var c = (((cls.count + cls.side * 20) % 40) / 10) | 0;
            Sprite.image(sp, hndl.turtle, (1 - cls.side) * 128 + c * 32, 0, 32, 32);
        }
        cls.count++;
    };
    Player.set = function () {
        AtField.sideSp = [0, 0];
        new Player(0);
        new Player(1);
    };
    Player.getX = function (side) {
        switch (side) {
            case 0: return Player.leftX;
            case 1: return Player.rightX;
        }
    };
    Player.leftX = 8;
    Player.rightX = ROUGH_WIDTH - 32 - 8;
    return Player;
}());
var AtField = /** @class */ (function () {
    function AtField(link, side) {
        var sp = Sprite.set();
        var cls = this;
        Sprite.link(sp, link);
        cls.count = 0;
        Sprite.offset(sp, -2 + 16 + ((side == 0) ? 1 : -1) * 16, -8, -100);
        Sprite.belong(sp, cls);
        Sprite.update(sp, cls.update);
        AtField.sideSp[side] = sp;
    }
    AtField.prototype.update = function () {
        var sp = Sprite.callIndex;
        var cls = Sprite.belong(sp);
        {
            var c = ((cls.count % 24) / 6) | 0;
            Sprite.image(sp, hndl.atField, c * 4, 0, 4, 48);
        }
        cls.count++;
    };
    return AtField;
}());
//ボール
var Ball = /** @class */ (function () {
    function Ball(vel) {
        this.vel = 1;
        var sp = Sprite.set();
        var cls = this;
        cls.count = 0;
        cls.x = ROUGH_WIDTH / 2 - 8;
        cls.y = ROUGH_HEIGHT / 2 - 8;
        cls.vx = Useful.rand2(-100, 100) / 100;
        cls.vy = Useful.rand2(-100, 100) / 100;
        cls.vel = vel;
        cls.velCalculate(cls);
        Sprite.offset(sp, cls.x, cls.y, -100);
        Sprite.belong(sp, cls);
        Sprite.update(sp, cls.update);
        cls.shadowSp = [0, 0, 0];
        for (var i = 0; i < 8; i++) { //影
            cls.shadowSp[i] = Sprite.set(hndl.ball, 16 * 8, 0, 16, 16);
            Sprite.blendPal(cls.shadowSp[i], 50 - i * 5);
        }
        cls.xyLog = [];
        for (var i = 0; i < 60; i++) {
            cls.xyLog.push([cls.x, cls.y]);
        }
    }
    Ball.prototype.update = function () {
        var sp = Sprite.callIndex;
        var cls = Sprite.belong(sp);
        cls.move(cls);
        Sprite.offset(sp, cls.x, cls.y);
        {
            var c = ((cls.count % 24) / 3) | 0;
            Sprite.image(sp, hndl.ball, c * 16, 0, 16, 16);
        }
        cls.shadows(cls);
        cls.count++;
    };
    Ball.prototype.velCalculate = function (cls) {
        var x = cls.vx;
        var y = cls.vy;
        while (true) {
            var rad = Math.atan2(y, x);
            if (Math.abs(Math.cos(rad)) > 0.8) {
                cls.vx = Math.cos(rad) * cls.vel;
                cls.vy = Math.sin(rad) * cls.vel;
                return;
            }
            if (x < 0)
                x--;
            else
                x++;
            //console.log(x, y)
        }
    };
    Ball.prototype.move = function (cls) {
        var _a;
        var y1 = cls.y;
        var x1 = cls.x;
        if (Useful.between(cls.x, 64, ROUGH_WIDTH - 16 - 64)) {
            cls.x += cls.vx;
            cls.y += cls.vy;
        }
        else {
            if (Ball.bulletSleep > 0 &&
                ((cls.x < 64 && cls.vx < 0) ||
                    (cls.x > ROUGH_WIDTH - 16 - 64 && cls.vx > 0))) {
                //バレットタイムで停止中
                cls.x -= cls.vx / 9;
            }
            else {
                cls.x += cls.vx / 3; // cls.y += cls.vy/3;        
            }
        }
        if (cls.y < 0 || cls.y > ROUGH_HEIGHT - 16) {
            cls.y = Math.max(cls.y, 0);
            cls.y = Math.min(cls.y, ROUGH_HEIGHT - 16);
            cls.vy *= -1;
        }
        var y2 = cls.y;
        var x2 = cls.x;
        if (cls.x < 0 || cls.x > ROUGH_WIDTH - 16) { //ゲームオーバーに
            if (gameState == GAME_PLAYING)
                Sound.playSoundFile("./sounds/over.mp3");
            gameState = GAME_OVER;
        }
        for (var i = 0; i < 2; i++) { //プレイヤーと当たり判定
            var sp0 = AtField.sideSp[i];
            var x0 = void 0, y0 = void 0;
            _a = Sprite.screenXY(sp0), x0 = _a[0], y0 = _a[1];
            x0 += 2 - i * 16;
            y0 += 24 - 8;
            if (Math.sign(x0 - x1) != Math.sign(x0 - x2)) {
                var cy = (y1 * (x2 - x0) + y2 * (x0 - x1)) / (x2 - x1);
                if (Useful.between(cy, y0 - 24 - 20, y0 + 24 + 20)) { //接触
                    cls.x = x0;
                    cls.vx *= -1;
                    cls.x += Math.sign(cls.vx) * 0.1;
                    cls.vy += cls.vx * Useful.rand(100) / 100 * ((Useful.rand(2) == 0) ? 1 : -1);
                    if (cls.vel < ((Main.level <= 5) ? 2.5 : 4))
                        cls.vel += 0.2;
                    //console.log("vel",cls.vel);
                    cls.velCalculate(cls);
                    Ball.reflectCount++;
                    Ball.bulletSleep = 20;
                    if (gameState == GAME_PLAYING)
                        gameScore += 100;
                    Sound.playSoundFile("./sounds/reflent.mp3");
                    break;
                }
            }
        }
    };
    Ball.prototype.shadows = function (cls) {
        var _a;
        cls.xyLog.shift();
        cls.xyLog.push([cls.x, cls.y]);
        for (var i = 0; i < 8; i++) {
            var x = void 0, y = void 0;
            _a = cls.xyLog[60 - 1 - i * 1], x = _a[0], y = _a[1];
            Sprite.offset(cls.shadowSp[i], x, y);
        }
    };
    Ball.reflectCount = 0;
    Ball.bulletSleep = 0;
    return Ball;
}());
var BallGenerator = /** @class */ (function () {
    function BallGenerator() {
        var sp = Sprite.set(-1, 0, 0, 16, 16);
        var cls = this;
        cls.genarated = 0;
        Sprite.offset(sp, 0, 0, 0);
        Sprite.belong(sp, cls);
        Sprite.update(sp, cls.update);
        Ball.reflectCount = 0;
        Ball.bulletSleep = 0;
    }
    BallGenerator.prototype.update = function () {
        var sp = Sprite.callIndex;
        var cls = Sprite.belong(sp);
        if ((Main.level == 1 && cls.genarated == 0) ||
            (Main.level == 4 && cls.genarated == 1) ||
            (Main.level == 6 && cls.genarated == 2) ||
            (Main.level == 8 && cls.genarated <= 4)) {
            new Ball(cls.genarated == 0 ? 1 : 0.8);
            cls.genarated++;
            Sound.playSoundFile("./sounds/genetate.mp3");
        }
        if (Ball.bulletSleep > 0)
            Ball.bulletSleep--;
    };
    return BallGenerator;
}());
var Effect = /** @class */ (function () {
    function Effect() {
    }
    Effect.Explosion = /** @class */ (function () {
        function class_1(x, y, type) {
            this.x = x;
            this.y = y;
            this.count = 0;
            this.type = type;
            var sp = Sprite.set(hndl.explode, 0, 0, 32, 32);
            Sprite.offset(sp, x, y, -1000);
            Sprite.belong(sp, this);
            Sprite.update(sp, this.update);
        }
        class_1.prototype.update = function () {
            var sp = Sprite.callIndex;
            var cls = Sprite.belong(sp);
            var temp = 5;
            {
                var c = ((cls.count % (temp * 6)) / temp) | 0;
                Sprite.image(sp, hndl.explode, c * 32, cls.type * 32, 32, 32);
            }
            cls.count++;
            if (cls.count > (temp * 6)) {
                Sprite.clear(sp);
            }
        };
        class_1.diffuse = function (x, y, type) {
            new Effect.Explosion(x - 16, y - 16, type);
            new Effect.Explosion(x + 16, y - 16, type);
            new Effect.Explosion(x - 16, y + 16, type);
            new Effect.Explosion(x + 16, y + 16, type);
        };
        return class_1;
    }());
    Effect.Star = /** @class */ (function () {
        function class_2(type, x, y, vx, vy) {
            this.count = 0;
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            var sp = Sprite.set(hndl.star, type * 24, 0, 24, 24);
            Sprite.offset(sp, x, y, -500);
            Sprite.belong(sp, this);
            Sprite.update(sp, this.update);
        }
        class_2.prototype.update = function () {
            var sp = Sprite.callIndex;
            var cls = Sprite.belong(sp);
            cls.x += cls.vx;
            cls.y += cls.vy;
            cls.vy -= 0.1;
            Sprite.offset(sp, cls.x, cls.y);
            cls.count++;
            if (cls.count > 180) {
                Sprite.clear(sp);
                return;
            }
        };
        class_2.set = function (x, y, type) {
            for (var i = -3; i <= 3; i++) {
                var ang = (-90 + i * 30) / 180 * Math.PI;
                var vx = Math.cos(ang) * 2;
                var vy = Math.sin(ang) * 2;
                new Effect.Star((type == 0) ? Math.abs(i % 2) : 2, x, y, vx, vy);
            }
        };
        return class_2;
    }());
    return Effect;
}());
var UiTexts = /** @class */ (function () {
    function UiTexts() {
        var sp = Sprite.set();
        Sprite.belong(sp, this);
        Sprite.DrawingProcess(sp, this.drawing);
        Sprite.offset(sp, 0, 0, -4096);
        Useful.drawStringInit();
        //console.log(Sprite.sprite[sp],sp);
    }
    UiTexts.prototype.drawing = function (x, y) {
        UiTexts.baseText();
        //Useful.drawStringEdged(0, 48*2, curPosX + ", " + curPosY + "(" + mouseState + ")");
        //Useful.drawStringEdged(0, 48*4, Sprite.usedRate());
        if (gameState == GAME_OVER) {
            Useful.drawStringEdged(160 * ROUGH_SCALE, SCREEN_HEIGHT / 2 - 24, "G A M E  O V E R");
        }
    };
    UiTexts.baseText = function () {
        Useful.drawStringEdged(0, 48 * 0, "SCORE: " + gameScore);
        {
            var t = "LEVEL: " + Main.level;
            if (Main.level >= 8)
                t = "LEVEL: ∞";
            Useful.drawStringEdged(360 * ROUGH_SCALE, 0, t);
        }
    };
    return UiTexts;
}());
//マトリックス風テキストを表示
var MatrixText = /** @class */ (function () {
    function MatrixText() {
        this.count = 0;
        this.animTemp = Useful.rand2(10, 40);
        var cls = this;
        var sp = Sprite.set();
        cls.vy = 1 + Useful.rand(20) / 10;
        cls.vy = 0.5 + ((cls.vy * 0.6) | 0);
        Sprite.blendPal(sp, 15 + cls.vy * 10);
        if (Useful.rand(2) == 0) {
            cls.y = -128;
        }
        else {
            cls.y = ROUGH_HEIGHT;
            cls.vy *= -1;
        }
        cls.x = Useful.rand((ROUGH_WIDTH / 16) | 0) * 16;
        Sprite.offset(sp, cls.x, cls.y, 1000);
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update);
        Sprite.protect(sp, true);
    }
    MatrixText.prototype.update = function () {
        var sp = Sprite.callIndex;
        var cls = Sprite.belong(sp);
        cls.y += cls.vy;
        if (cls.y > ROUGH_HEIGHT + 1 || cls.y < -128 - 1) {
            Sprite.clear(sp);
            return;
        }
        Sprite.offset(sp, cls.x, cls.y);
        {
            var c = ((cls.count % (cls.animTemp * 3)) / cls.animTemp | 0);
            Sprite.image(sp, hndl.matrixText, 16 * c, 0, 16, 128);
        }
        cls.count++;
    };
    return MatrixText;
}());
var MatrxTextGenerator = /** @class */ (function () {
    function MatrxTextGenerator() {
        var cls = this;
        var sp = Sprite.set();
        Sprite.offset(sp, 0, 0, 4000);
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update);
        Sprite.protect(sp, true);
        cls.count = 0;
    }
    MatrxTextGenerator.prototype.update = function () {
        var sp = Sprite.callIndex;
        var cls = Sprite.belong(sp);
        {
            var c = 42 - Main.level * 5;
            if (gameState === GAME_BREAK)
                c = 9;
            if (cls.count % c == 0) {
                new MatrixText();
            }
        }
        //console.log(Sprite.usedRate());
        cls.count++;
    };
    return MatrxTextGenerator;
}());
var BackDarkGreen = /** @class */ (function () {
    function BackDarkGreen() {
        this.count = 0;
        var sp = Sprite.set(hndl.back, 0, 0, 416, 240);
        Sprite.offset(sp, 0, 0, 4000);
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update);
        Sprite.protect(sp, true);
    }
    BackDarkGreen.prototype.update = function () {
        var sp = Sprite.callIndex;
        var cls = Sprite.belong(sp);
    };
    return BackDarkGreen;
}());
var Templa = /** @class */ (function () {
    function Templa() {
        var sp = Sprite.set(-1, 0, 0, 16, 16);
        var cls = this;
        cls.count = 0;
        Sprite.offset(sp, 0, 0, 0);
        Sprite.belong(sp, cls);
        Sprite.update(sp, cls.update);
    }
    Templa.prototype.update = function () {
        var sp = Sprite.callIndex;
        var cls = Sprite.belong(sp);
    };
    return Templa;
}());
var Cardinal = /** @class */ (function () {
    function Cardinal() {
        Main.level = 1;
        var sp = Sprite.set();
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update);
    }
    Cardinal.prototype.update = function () {
        var sp = Sprite.callIndex;
        var cls = Sprite.belong(sp);
        {
            var c = Main.count;
            var r = Ball.reflectCount;
            if (r >= 5)
                Main.level = 2;
            if (r >= 10)
                Main.level = 3;
            if (r >= 15)
                Main.level = 4;
            if (r >= 30)
                Main.level = 5;
            if (r >= 50)
                Main.level = 6;
            if (r >= 70)
                Main.level = 7;
            if (r >= 100)
                Main.level = 8;
        }
    };
    return Cardinal;
}());
//お役立ちクラス
var Useful = /** @class */ (function () {
    function Useful() {
    }
    Useful.drawStringInit = function () {
        context.font = "48px 'Impact'";
        context.lineWidth = "8";
        context.lineJoin = "miter";
        context.miterLimit = "5";
    };
    Useful.drawStringEdged = function (x, y, text, inColor) {
        if (inColor === void 0) { inColor = "#7f7"; }
        y += 48;
        context.strokeText(text, x, y);
        context.fillStyle = inColor;
        context.fillText(text, x, y);
    };
    Useful.rand = function (n) {
        return (Math.random() * n) | 0;
    };
    Useful.rand2 = function (min, max) {
        return min + this.rand(max - min);
    };
    Useful.between = function (n, min, max) {
        return (min <= n && n <= max);
    };
    Useful.isString = function (obj) {
        return typeof (obj) == "string" || obj instanceof String;
    };
    ;
    return Useful;
}());
var SpriteCompornent = /** @class */ (function () {
    function SpriteCompornent() {
        this.used = false;
        this.x = 0;
        this.y = 0;
        this.image = -1;
        this.u = 0;
        this.v = 0;
        this.width = 0;
        this.height = 0;
        this.reverse = false;
        this.isProtect = false;
        this.mask = 0;
        this.link = -1;
        this.colliderX = 0;
        this.colliderY = 0;
        this.colliderWidth = 0;
        this.colliderHeight = 0;
        this.blendPal = 1.0;
        this.belong = undefined;
        this.update = function () { };
        this.drawing = Sprite.Drawing.rough;
    }
    return SpriteCompornent;
}());
var Sprite = /** @class */ (function () {
    function Sprite() {
    }
    Sprite.init = function () {
        this.sprite = new Array(this.SPRITE_MAX);
        this.sprite_Z = [];
        for (var i = 0; i < this.SPRITE_MAX; i++) {
            this.sprite[i] = new SpriteCompornent();
            this.sprite_Z.push([i, 0]);
        }
        console.log("Sprite init succeeded");
    };
    Sprite.set = function (imageHndl, u, v, w, h) {
        if (imageHndl === void 0) { imageHndl = -1; }
        if (u === void 0) { u = 0; }
        if (v === void 0) { v = 0; }
        if (w === void 0) { w = 16; }
        if (h === void 0) { h = 16; }
        for (var i = 0; i < this.SPRITE_MAX; i++) {
            var sp = (this.nextNum + i) % this.SPRITE_MAX;
            if (this.sprite[sp].used == false) {
                this.sprite[sp] = new SpriteCompornent();
                this.sprite_Z[sp][1] = 0;
                this.sprite[sp].used = true;
                this.sprite[sp].image = imageHndl;
                this.sprite[sp].u = u;
                this.sprite[sp].v = v;
                this.sprite[sp].width = w;
                this.sprite[sp].height = h;
                this.sprite[sp].colliderWidth = w;
                this.sprite[sp].colliderHeight = h;
                this.nextNum = sp + 1;
                return sp;
            }
        }
        return -1;
    };
    Sprite.reverse = function (sp, rev) {
        if (rev === void 0) { rev = true; }
        this.sprite[sp].reverse = rev;
    };
    Sprite.image = function (sp, imageHndl, u, v, w, h) {
        if (imageHndl === void 0) { imageHndl = undefined; }
        if (u === void 0) { u = undefined; }
        if (v === void 0) { v = undefined; }
        if (w === void 0) { w = undefined; }
        if (h === void 0) { h = undefined; }
        if (imageHndl !== undefined)
            this.sprite[sp].image = imageHndl;
        if (u !== undefined)
            this.sprite[sp].u = u;
        if (v !== undefined)
            this.sprite[sp].v = v;
        if (w !== undefined)
            this.sprite[sp].width = w;
        if (h !== undefined)
            this.sprite[sp].height = h;
    };
    Sprite.offset = function (sp, x, y, z) {
        if (z === void 0) { z = undefined; }
        this.sprite[sp].x = x;
        this.sprite[sp].y = y;
        if (z !== undefined) {
            this.sprite_Z[sp][1] = z;
        }
    };
    Sprite.screenXY = function (sp) {
        var x = this.sprite[sp].x + this.linkDifference_X(sp);
        var y = this.sprite[sp].y + this.linkDifference_Y(sp);
        return [x, y];
    };
    Sprite.belong = function (sp, cls) {
        if (cls === void 0) { cls = undefined; }
        if (cls == undefined)
            return this.sprite[sp].belong;
        this.sprite[sp].belong = cls;
    };
    Sprite.link = function (sp, link) {
        this.sprite[sp].link = link;
    };
    Sprite.linkDifference_X = function (sp) {
        if (this.sprite[sp].link != -1) {
            var spli = this.sprite[sp].link;
            return this.sprite[spli].x + this.linkDifference_X(spli);
        }
        else {
            return 0;
        }
    };
    Sprite.linkDifference_Y = function (sp) {
        if (this.sprite[sp].link != -1) {
            var spli = this.sprite[sp].link;
            return this.sprite[spli].y + this.linkDifference_Y(spli);
        }
        else {
            return 0;
        }
    };
    Sprite.blendPal = function (sp, pal256) {
        this.sprite[sp].blendPal = pal256 / 255;
    };
    Sprite.update = function (sp, func) {
        this.sprite[sp].update = func;
    };
    Sprite.DrawingProcess = function (sp, func) {
        this.sprite[sp].drawing = func;
    };
    //クリアしないようにする
    Sprite.protect = function (sp, protect) {
        this.sprite[sp].isProtect = protect;
    };
    Sprite.clear = function (sp, protect) {
        if (protect === void 0) { protect = false; }
        if (protect && this.sprite[sp].isProtect)
            return;
        this.sprite[sp].used = false;
        this.nextNum = sp + 1;
    };
    Sprite.allClear = function (protect) {
        if (protect === void 0) { protect = false; }
        for (var i = 0; i < this.SPRITE_MAX; i++) {
            if (protect && this.sprite[i].isProtect)
                continue;
            this.sprite[i].used = false;
        }
    };
    Sprite.collider = function (sp, x, y, w, h, mask) {
        if (x === void 0) { x = undefined; }
        if (y === void 0) { y = undefined; }
        if (w === void 0) { w = undefined; }
        if (h === void 0) { h = undefined; }
        if (mask === void 0) { mask = undefined; }
        if (x !== undefined)
            this.sprite[sp].x = x;
        if (y !== undefined)
            this.sprite[sp].y = y;
        if (w !== undefined)
            this.sprite[sp].width = w;
        if (h !== undefined)
            this.sprite[sp].height = h;
        if (mask !== undefined)
            this.sprite[sp].mask = mask;
    };
    Sprite.hitRectangle = function (x, y, width, height, mask, min, max) {
        if (min === void 0) { min = 0; }
        if (max === void 0) { max = this.SPRITE_MAX; }
        var x1 = x, y1 = y, w1 = width, h1 = height;
        //console.log(min+","+max);
        for (var i = min; i < max; i++) {
            if (this.sprite[i].used == true && (this.sprite[i].mask & mask) != 0) {
                var x2 = this.sprite[i].x + this.linkDifference_X(i) + this.sprite[i].colliderX;
                var y2 = this.sprite[i].y + this.linkDifference_Y(i) + this.sprite[i].colliderY;
                var w2 = this.sprite[i].width;
                var h2 = this.sprite[i].height;
                if ((Math.abs(x2 - x1) < w1 / 2 + w2 / 2)
                    &&
                        (Math.abs(y2 - y1) < h1 / 2 + h2 / 2)) {
                    return i;
                }
            }
        }
    };
    Sprite.usedRate = function () {
        var c = 0;
        for (var i = 0; i < this.SPRITE_MAX; i++) {
            if (this.sprite[i].used)
                c += 1;
        }
        return c + " / " + this.SPRITE_MAX;
    };
    Sprite.allUpdate = function () {
        for (var i = 0; i < this.SPRITE_MAX; i++) {
            if (this.sprite[i].used == true) {
                this.callIndex = i;
                this.sprite[i].update();
                //console.log(this.sprite[i]);   
            }
        }
    };
    Sprite.allDrawing = function () {
        var ol = this.sprite_Z.slice();
        ol.sort(function (a, b) { return b[1] - a[1]; });
        for (var i in ol) {
            var sp = ol[i][0];
            if (this.sprite[sp].used == true) {
                var x = void 0, y = void 0;
                if (this.sprite[sp].link != -1) {
                    x = (this.sprite[sp].x + this.linkDifference_X(sp)) | 0;
                    y = (this.sprite[sp].y + this.linkDifference_Y(sp)) | 0;
                }
                else {
                    x = (this.sprite[sp].x) | 0;
                    y = (this.sprite[sp].y) | 0;
                }
                x *= this.roughScale;
                y *= this.roughScale;
                this.callIndex = sp;
                context.globalAlpha = this.sprite[sp].blendPal;
                this.sprite[sp].drawing(x, y);
            }
        }
    };
    Sprite.SPRITE_MAX = 512;
    Sprite.sprite_Z = [];
    Sprite.nextNum = 0;
    Sprite.roughScale = 3;
    Sprite.Drawing = /** @class */ (function () {
        function class_3() {
        }
        class_3.rough = function (x, y) {
            var sp = Sprite.callIndex;
            Sprite.Drawing.draw(sp, x, y, Sprite.roughScale);
        };
        class_3.detail = function (x, y) {
            var sp = Sprite.callIndex;
            Sprite.Drawing.draw(sp, x, y, 1);
        };
        class_3.draw = function (sp, x, y, scale) {
            if (Sprite.sprite[sp].image == -1)
                return;
            var spr = Sprite.sprite[sp];
            Graph.drawGraph(x, y, spr.u, spr.v, spr.width, spr.height, spr.image, scale);
        };
        return class_3;
    }());
    return Sprite;
}());
//グラフィック読み込み
var Graph = /** @class */ (function () {
    function Graph() {
    }
    //画像読み込み
    Graph.loadGraph = function (path) {
        var handler = this.imageIndex_;
        this.images_[handler] = new Image;
        this.images_[handler].src = path;
        this.imageIndex_++;
        return handler;
    };
    //描画
    Graph.drawGraph = function (x, y, u, v, w, h, handle, scale) {
        context.drawImage(this.images_[handle], u, v, w, h, x, y, w * scale, h * scale);
    };
    Graph.images_ = {};
    Graph.imageIndex_ = 0;
    return Graph;
}());
var Sound = /** @class */ (function () {
    function Sound() {
    }
    Sound.playSoundFile = function (path, vol, loop) {
        if (vol === void 0) { vol = 0.5; }
        if (loop === void 0) { loop = false; }
        var music = new Audio(path);
        music.volume = vol;
        music.loop = false;
        music.play();
        if (loop) {
            music.addEventListener("ended", function () {
                music.currentTime = 0;
                music.play();
            }, false);
        }
        return music;
    };
    return Sound;
}());
