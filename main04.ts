
let canvas;
let context;
let gameLoopTimer;
let curPosX = 0;
let curPosY = 0;
let mouseState = -1;
let hndl: Handler;

let playerName: string="";
let gameState: number=0;
let gameScore: number=0;
let playBgm: HTMLAudioElement = undefined;

const KEY_USE = ['f','j'];
let isKeyDown = {};

const GAME_BREAK = -1;
const GAME_PLAYING=0;
const GAME_OVER=1;

const ROUGH_SCALE = 3;
const ROUGH_WIDTH = 416; 
const ROUGH_HEIGHT = 240;
const SCREEN_WIDTH = ROUGH_SCALE*ROUGH_WIDTH;
const SCREEN_HEIGHT = ROUGH_SCALE*ROUGH_HEIGHT;

const COL_FIRE = 1 << 0;


let socket = new WebSocket('ws://127.0.0.1:5003');
//let socket = new WebSocket('ws://49.212.155.232:5003');
let isSocketConnect: boolean = false;



window.onload = function() {
    canvas = document.getElementById("canvas1");
    if ( canvas.getContext ) {
        context = canvas.getContext("2d");
        context.imageSmoothingEnabled = this.checked;
        context.mozImageSmoothingEnabled = this.checked;
        context.webkitImageSmoothingEnabled = this.checked;
        context.msImageSmoothingEnabled = this.checked;

        Sprite.init();
        hndl = new Handler();

        SceneChage.init();
        SceneChage.toTitle();
        
        document.onmousemove = onMouseMove;   // マウス移動ハンドラ
        document.onmouseup = onMouseUp;       // マウスアップハンドラ
        document.onmousedown = onMouseDown;   // マウスダウンハンドラ

        onKeyInit();
        document.addEventListener("keypress", onKeyDown); //キーボード入力
        document.addEventListener("keyup", onKeyUp);


    }
}




// 接続
socket.addEventListener('open',function(e){
    isSocketConnect=true;
    console.log('Socket connection succeeded');
    scoresWrite()
});

socket.addEventListener('message',function(e){
    let d=e.data+"";
    console.log("received: "+d);
    let dat=d.split(',');

    let s=`<div class="center">[ SCORE RANKING ]<br></div>`;
    const size=16;
    for (let i=0; i<size; i++)
    {
        let n=(i+1)+"";
        s+=`<span class="rankorder">${n.padStart(2, '0')}</span>`;
        s+=`<span class="rankname">${dat[size+i]==""?"ANONYMOUS":dat[size+i]}</span>`;
        s+=`<span class="score-number">${dat[i]}</span><br>`
    }
    let par1 = document.getElementById("scores");
    par1.innerHTML = s;

    let par2 = document.getElementById("plays");
    par2.innerHTML = `このゲームは計 ${dat[size*2]} 回プレイされました`

});


function checkForm($this)
{
    let str: string=$this.value;
    while(str.match(/[^A-Z^a-z\d\-\_]/))
    {
        str=str.replace(/[^A-Z^a-z\d\-\_]/,"");
    }
    $this.value=str.toUpperCase().substr(0, 16);
    playerName = $this.value;
}


function onMouseMove( e ) {
    curPosX = e.clientX;
    curPosY = e.clientY;
    let pos = clientToCanvas( canvas, curPosX, curPosY );
    curPosX = pos.x;
    curPosY = pos.y;
}

function onKeyInit() {
    for (let i=0; i<KEY_USE.length; i++)
    {
        isKeyDown[KEY_USE[i]] = false;
    }
}

function onKeyDown(e) {
    //console.log(e.key);
    for (let i=0; i<KEY_USE.length; i++)
    {
        let c = KEY_USE[i];
        if (e.key === c || e.key === c.toUpperCase())
        {
            isKeyDown[c] = true;
        }
    }
}

function onKeyUp ( e ){
    for (let i=0; i<KEY_USE.length; i++)
    {
        let c = KEY_USE[i];
        if (e.key === c || e.key === c.toUpperCase())
        {
            isKeyDown[c] = false;
        }
    }
}



function onMouseKey( e ) {
    mouseState = -1;
}


function onMouseDown( e ) {
    mouseState = e.button;
}

function onMouseUp( e ) {
    mouseState = -1;
}


function clientToCanvas(canvas, clientX, clientY) {
    let cx = clientX - canvas.offsetLeft + document.body.scrollLeft;
    let cy = clientY - canvas.offsetTop + document.body.scrollTop;
    //console.log(clientY , canvas.offsetTop , document.body.scrollTop);
    let ret = {
        x: cx,
        y: cy
    };
    return ret;
}




class Handler
{
    back: number = Graph.loadGraph("./images/backDarkGreen--416x240.png");;
    explode: number = Graph.loadGraph("./images/explode--32.png");;
    star: number=Graph.loadGraph("./images/stars--24.png");
    matrixText: number = Graph.loadGraph("./images/matrixText--16x128.png");
    turtle :number = Graph.loadGraph("./images/hornTurtle--32.png");
    atField: number = Graph.loadGraph("./images/atField--4x48.png");
    ball: number = Graph.loadGraph("./images/greenBall--16.png");

    constructor()
    {
    }
}



class SceneChage
{
    static init()
    {
        gameLoopTimer = setInterval( function(){},16);
        new BackDarkGreen();
        new MatrxTextGenerator();
    }
    static toMain()
    {
        clearInterval(gameLoopTimer);
        Main.set();
        gameLoopTimer = setInterval( Main.loop, 16 );
    }
    static toTitle()
    {
        clearInterval(gameLoopTimer);
        Title.set();
        gameLoopTimer = setInterval( Title.loop, 16 );
    }
    
}




//タイトル
class Title
{
    static set()
    {
        new TitleUi();
        gameState = GAME_BREAK;
    }
    static loop()
    {
        Sprite.allUpdate();
        Sprite.allDrawing();    
        if (mouseState==0 && Useful.between(curPosX+window.pageXOffset,0,SCREEN_WIDTH) && Useful.between(curPosY+window.pageYOffset,0,SCREEN_HEIGHT)) 
        {
            Sprite.allClear(true);
            //Sound.playSoundFile("./sounds/startPush.mp3");
            SceneChage.toMain();
        }
    }
}

class TitleUi
{
    constructor()
    {
        let sp=Sprite.set();
        Sprite.belong(sp, this);
        Sprite.DrawingProcess(sp, this.drawing);
        Sprite.offset(sp, 0 , 0, -4096);
        Useful.drawStringInit();
    }
    drawing(x,y)
    {
        UiTexts.baseText();
        Useful.drawStringEdged(112*ROUGH_SCALE, SCREEN_HEIGHT/2-24, "LEFT CLICK TO START THE GAME");
    }
}


//ページ内にスコアランキングを表示する
function scoresWrite()
{
    let send: string="";
    send += gameScore.toString()+",";
    send += playerName;
    if (isSocketConnect)socket.send(send);
}




//メインループ
class Main
{
    static count=0;
    static finishCount=0;
    static level=1;

    static set()
    {
        
        Player.set();
        new BallGenerator();
        new UiTexts();
        
        new Cardinal();
        gameState = GAME_PLAYING;
        gameScore=0;
        Main.count=0;
        Main.finishCount=0;

        playBgm = Sound.playSoundFile("./sounds/environment.mp3", 0.2, true);
    }

    static loop() 
    {
        context.clearRect( 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
        Sprite.allUpdate();
        Sprite.allDrawing();

        Main.count++;
        switch(gameState)
        {
            case GAME_PLAYING:
                {
                    if (Main.count%12==0) gameScore++;
                    break;
                }
            case GAME_OVER:
                {
                    Main.finishCount++;
                    if (Main.finishCount>60*4)
                    {
                        scoresWrite();
                        Sprite.allClear(true);
                        playBgm.pause();
                        SceneChage.toTitle();
                        return;
                    }
                    break;
                }
        }
    }


}






///プレイヤー
class Player
{
    static leftX=8;
    static rightX = ROUGH_WIDTH-32-8; 

    x: number;
    y: number;
    side: number;
    count: number;

    constructor(side: number)
    {
        let sp = Sprite.set();
        let cls: Player = this;
        cls.x=Player.getX(side);
        cls.y=0;
        cls.count=0;
        cls.side = side;
        Sprite.belong(sp, cls);
        Sprite.update(sp, cls.update);

        new AtField(sp, side);

    }
    
    update()
    {
        let sp=Sprite.callIndex;
        let cls: Player=Sprite.belong(sp);

        cls.y = (curPosY+window.pageYOffset)/ROUGH_SCALE-16;

        Sprite.offset(sp, cls.x, cls.y, -100);
        
        {
            let c = (((cls.count+cls.side*20)%40)/10) | 0
            Sprite.image(sp, hndl.turtle,(1-cls.side)*128+c*32,0,32,32);
        }
        cls.count++;
    }


    static set()
    {
        AtField.sideSp = [0,0];
        new Player(0);
        new Player(1);
    }

    static getX(side)
    {
        switch(side)
        {
            case 0:return Player.leftX;
            case 1:return Player.rightX;
        }
    }
}



class AtField
{
    count: number;
    side: number;

    constructor(link, side)
    {
        let sp = Sprite.set();
        let cls = this;
        Sprite.link(sp, link);
        cls.count = 0;
        Sprite.offset(sp, -2+16+((side==0)?1:-1)*16,-8, -100);
        Sprite.belong(sp, cls);
        Sprite.update(sp, cls.update); 
        AtField.sideSp[side] = sp;
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls: AtField=Sprite.belong(sp);

        {
            let c = ((cls.count%24)/6)|0;
            Sprite.image(sp, hndl.atField, c*4, 0, 4, 48);
        }
        cls.count++;
    }
    
    static sideSp: Array<number>;
}


//ボール
class Ball
{
    static reflectCount=0;
    static bulletSleep = 0;
    count: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    vel: number = 1;
    shadowSp: Array<number>
    xyLog: Array<Array<number>>

    constructor(vel)
    {
        let sp = Sprite.set();
        let cls = this;
        cls.count = 0;
        cls.x = ROUGH_WIDTH/2-8;
        cls.y = ROUGH_HEIGHT/2-8;
        cls.vx = Useful.rand2(-100,100)/100;
        cls.vy = Useful.rand2(-100,100)/100;
        cls.vel = vel;
        cls.velCalculate(cls);

        Sprite.offset(sp, cls.x, cls.y, -100);
        Sprite.belong(sp, cls);
        Sprite.update(sp, cls.update);

        cls.shadowSp=[0,0,0];
        for (let i=0; i<8; i++)
        {//影
            cls.shadowSp[i] = Sprite.set(hndl.ball,16*8,0,16,16);
            Sprite.blendPal(cls.shadowSp[i], 50-i*5);
        }
        cls.xyLog=[];
        for (let i=0; i<60; i++)
        {
            cls.xyLog.push([cls.x, cls.y]);
        }
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls: Ball=Sprite.belong(sp);

        cls.move(cls);

        Sprite.offset(sp, cls.x, cls.y);
        {
            let c = ((cls.count%24)/3) | 0;
            Sprite.image(sp, hndl.ball, c*16, 0, 16, 16);
        }
        
        cls.shadows(cls);

        cls.count++;
    }
    velCalculate(cls: Ball)
    {
        let x = cls.vx;
        let y = cls.vy;
        while(true)
        {
            let rad = Math.atan2(y, x);
            if (Math.abs(Math.cos(rad))>0.8)
            {
                cls.vx = Math.cos(rad) * cls.vel;
                cls.vy = Math.sin(rad) * cls.vel;
                return;
            }
            if (x<0) x--; else x++;
            //console.log(x, y)
        }        
    }
    move(cls: Ball)
    {
        let y1 = cls.y;
        let x1 = cls.x;

        if (Useful.between(cls.x, 64, ROUGH_WIDTH-16-64))
        {
            cls.x += cls.vx; cls.y += cls.vy;
        }
        else
        {
            if (Ball.bulletSleep>0 && 
                ((cls.x<64 && cls.vx<0) ||
                (cls.x>ROUGH_WIDTH-16-64 && cls.vx>0)))
                {
                    //バレットタイムで停止中
                    cls.x-=cls.vx/9;
                }
                else
                {
                    cls.x += cls.vx/3;// cls.y += cls.vy/3;        
                }
        }

        
        if (cls.y<0 || cls.y>ROUGH_HEIGHT-16) 
        {
            cls.y=Math.max(cls.y, 0);
            cls.y=Math.min(cls.y, ROUGH_HEIGHT-16);
            cls.vy *= -1;
        }
        let y2 = cls.y;
        let x2 = cls.x;
        if (cls.x<0 || cls.x>ROUGH_WIDTH-16)
        {//ゲームオーバーに
            if (gameState==GAME_PLAYING) Sound.playSoundFile("./sounds/over.mp3");
            gameState=GAME_OVER;
        }
        
        for (let i=0; i<2; i++)
        {//プレイヤーと当たり判定
            let sp0 = AtField.sideSp[i];
            let x0, y0;
            [x0, y0]=Sprite.screenXY(sp0);
            x0 += 2 - i*16;
            y0 += 24 - 8;

            if (Math.sign(x0-x1)!=Math.sign(x0 - x2))
            {
                let cy = (y1*(x2-x0)+y2*(x0-x1))/(x2-x1)
                if (Useful.between(cy, y0-24-20, y0+24+20))
                {//接触
                    cls.x = x0;
                    cls.vx *= -1;
                    cls.x += Math.sign(cls.vx)*0.1;
                    cls.vy += cls.vx*Useful.rand(100)/100*((Useful.rand(2)==0)?1:-1);
                    if (cls.vel<((Main.level<=5)?2.5:4)) cls.vel+=0.2;
                    //console.log("vel",cls.vel);
                    cls.velCalculate(cls);
                    Ball.reflectCount++;
                    Ball.bulletSleep = 20;
                    if (gameState==GAME_PLAYING)gameScore += 100;
                    Sound.playSoundFile("./sounds/reflent.mp3");
                    break;
                }
            }

        }


    }
    shadows(cls:Ball)
    {
        cls.xyLog.shift();
        cls.xyLog.push([cls.x, cls.y]);
        for (let i=0; i<8; i++)
        {
            let x, y;
            [x,y]=cls.xyLog[60-1-i*1];
            Sprite.offset(cls.shadowSp[i], x,y);
        }
    }


}



class BallGenerator
{

    genarated: number;

    constructor()
    {
        let sp = Sprite.set(-1,0,0,16,16);
        let cls = this;
        cls.genarated = 0;
        Sprite.offset(sp, 0,0, 0);
        Sprite.belong(sp, cls);
        Sprite.update(sp, cls.update);
        Ball.reflectCount = 0; 
        Ball.bulletSleep = 0;
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls: BallGenerator=Sprite.belong(sp);

        if (
            (Main.level==1 && cls.genarated==0) ||
            (Main.level==4 && cls.genarated==1) ||
            (Main.level==6 && cls.genarated==2) ||
            (Main.level==8 && cls.genarated<=4)
        )
        {
            new Ball(cls.genarated==0 ? 1 : 0.8);
            cls.genarated++;
            Sound.playSoundFile("./sounds/genetate.mp3");
        }

        if (Ball.bulletSleep>0) Ball.bulletSleep--;
    }
}




class Effect
{
    static Explosion = class
    {

        x: number;
        y: number;
        count: number;
        type: number;

        constructor(x, y,type)
        {
            this.x=x;
            this.y=y;
            this.count=0;
            this.type=type;

            let sp=Sprite.set(hndl.explode, 0, 0, 32, 32);
            Sprite.offset(sp, x, y, -1000);
            Sprite.belong(sp, this);
            Sprite.update(sp, this.update);
        }
        update()
        {
            let sp=Sprite.callIndex;
            let cls=Sprite.belong(sp);

            let temp=5;
            {
                let c=((cls.count%(temp*6))/temp) | 0;
                Sprite.image(sp,hndl.explode, c*32, cls.type*32, 32, 32);    
            }
            cls.count++;
            if (cls.count>(temp*6))
            {
                Sprite.clear(sp);
            }
        }
        static diffuse(x,y,type)
        {
            new Effect.Explosion(x-16,y-16,type);
            new Effect.Explosion(x+16,y-16,type);
            new Effect.Explosion(x-16,y+16,type);
            new Effect.Explosion(x+16,y+16,type);
        }
    }

    static Star=class
    {
        count: number;
        x: number;
        y: number;
        vx: number;
        vy: number;

        constructor(type, x,y,vx,vy)
        {
            this.count = 0;
            this.x=x;
            this.y=y;
            this.vx=vx; 
            this.vy=vy;
            let sp = Sprite.set(hndl.star,type*24,0,24,24);
            Sprite.offset(sp, x,y,-500);
            Sprite.belong(sp, this);
            Sprite.update(sp, this.update); 
        }
        update()
        {
            let sp=Sprite.callIndex;
            let cls=Sprite.belong(sp);
            
            cls.x+=cls.vx;
            cls.y+=cls.vy;
            cls.vy -= 0.1;
            Sprite.offset(sp, cls.x, cls.y);
            cls.count++;
            if (cls.count>180) {Sprite.clear(sp);return;}
        }
        static set(x, y, type)
        {
            for (let i=-3; i<=3; i++)
            {
                let ang=(-90+i*30)/180*Math.PI;
                let vx=Math.cos(ang)*2;
                let vy=Math.sin(ang)*2;

                new Effect.Star((type==0) ? Math.abs(i%2) : 2,x,y,vx,vy);
            }
        }
    
    }
}













class UiTexts
{
    constructor()
    {
        let sp=Sprite.set();
        Sprite.belong(sp, this);
        Sprite.DrawingProcess(sp, this.drawing);
        Sprite.offset(sp, 0 , 0, -4096);
        Useful.drawStringInit();
        //console.log(Sprite.sprite[sp],sp);

    }
    drawing(x, y)
    {
        UiTexts.baseText();
        
        //Useful.drawStringEdged(0, 48*2, curPosX + ", " + curPosY + "(" + mouseState + ")");
        //Useful.drawStringEdged(0, 48*4, Sprite.usedRate());
        
        if (gameState==GAME_OVER)
        {
            Useful.drawStringEdged(160*ROUGH_SCALE, SCREEN_HEIGHT/2-24, "G A M E  O V E R");
        }
    }
    static baseText()
    {
        Useful.drawStringEdged(0, 48*0, `SCORE: ${gameScore}`);
        {
            let t=`LEVEL: ${Main.level}`
            if (Main.level>=8) t="LEVEL: ∞"
            Useful.drawStringEdged(360*ROUGH_SCALE,0,t);
        }
    }

}



//マトリックス風テキストを表示
class MatrixText
{
    count: number = 0;
    x: number;
    y:number;
    vy: number;
    animTemp=Useful.rand2(10,40);
    constructor()
    {
        let cls = this;
        let sp = Sprite.set();
        cls.vy = 1+Useful.rand(20)/10;
        cls.vy = 0.5+((cls.vy*0.6) | 0);
        Sprite.blendPal(sp, 15+cls.vy*10);
        if (Useful.rand(2)==0)
        {
            cls.y=-128;
        }else{
            cls.y=ROUGH_HEIGHT;
            cls.vy *= -1;
        }

        cls.x=Useful.rand((ROUGH_WIDTH/16) | 0)*16;
        Sprite.offset(sp, cls.x, cls.y, 1000);
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update); 
        Sprite.protect(sp, true);
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls: MatrixText=Sprite.belong(sp);
        cls.y+=cls.vy;
        if (cls.y>ROUGH_HEIGHT+1 || cls.y<-128-1) 
        {
            Sprite.clear(sp);
            return;
        }
        Sprite.offset(sp, cls.x, cls.y);
        {
            let c = ((cls.count%(cls.animTemp*3))/cls.animTemp | 0);
            Sprite.image(sp, hndl.matrixText,16*c,0,16,128);
        }
        cls.count++;
    }

}


class MatrxTextGenerator
{
    count: number;

    constructor()
    {
        let cls: MatrxTextGenerator = this;
        let sp = Sprite.set();
        Sprite.offset(sp, 0,0, 4000);
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update); 
        Sprite.protect(sp, true);
        cls.count=0;
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls: MatrxTextGenerator = Sprite.belong(sp);

        {
            let c = 42-Main.level*5;
            if (gameState === GAME_BREAK) c=9;
            if(cls.count%c==0)
            {
                new MatrixText();
            }
        }
        //console.log(Sprite.usedRate());
        cls.count++;
    }
}


class BackDarkGreen
{
    count: number;

    constructor()
    {
        this.count = 0;
        let sp = Sprite.set(hndl.back,0,0,416,240);
        Sprite.offset(sp, 0,0, 4000);
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update); 
        Sprite.protect(sp, true);
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls=Sprite.belong(sp);
    }
}





class Templa
{
    count: number;

    constructor()
    {
        let sp = Sprite.set(-1,0,0,16,16);
        let cls = this;
        cls.count = 0;
        Sprite.offset(sp, 0,0, 0);
        Sprite.belong(sp, cls);
        Sprite.update(sp, cls.update); 
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls=Sprite.belong(sp);
    }
}










class Cardinal
{
    constructor()
    {
        Main.level=1;

        let sp=Sprite.set();
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update);
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls=Sprite.belong(sp);

        {
            let c= Main.count;
            const r=Ball.reflectCount;
            if (r>=5) Main.level = 2;
            if (r>=10) Main.level = 3;
            if (r>=15) Main.level = 4;
            if (r>=30) Main.level = 5;
            if (r>=50) Main.level = 6;
            if (r>=70) Main.level = 7;
            if (r>=100) Main.level = 8;

            
        }
    }
}

















//お役立ちクラス
class Useful
{
    static drawStringInit()
    {
        context.font = "48px 'Impact'";
        context.lineWidth = "8";
        context.lineJoin = "miter";
        context.miterLimit = "5"
    }

    static drawStringEdged(x, y, text, inColor="#7f7")
    {
        y+=48;
        context.strokeText(text, x, y);
        context.fillStyle = inColor
        context.fillText(text, x, y);

    }

    static rand(n)
    {
        return (Math.random()*n) | 0;
    }
    static rand2(min, max)
    {
        return min+this.rand(max-min);
    }
    static between(n, min, max)
    {
        return (min<=n && n <= max);
    }
    static isString(obj) {
        return typeof (obj) == "string" || obj instanceof String;
    };

}









class SpriteCompornent
{
    used: boolean = false;
    x: number = 0;
    y: number = 0;
    image: number = -1;
    u: number = 0;
    v: number = 0;
    width: number = 0;
    height: number = 0;
    reverse: boolean = false;
    isProtect: boolean=false;
    mask: number = 0;
    link: number = -1;

    colliderX: number = 0;
    colliderY: number = 0;
    colliderWidth: number = 0;
    colliderHeight: number = 0;

    blendPal: number = 1.0;

    belong: any = undefined;
    
    update: () => void = function(){};
    drawing: (x, y)=>void = Sprite.Drawing.rough;

    constructor()
    {
    }    

}





class Sprite
{
    static SPRITE_MAX: number = 512;
    static sprite: SpriteCompornent[];
    static sprite_Z: Array<Array<number>> = []

    static nextNum: number=0;
    static roughScale: number = 3;

    static callIndex: number;

    static init()
    {
        this.sprite = new Array(this.SPRITE_MAX);
        this.sprite_Z = [];
        for(let i=0; i<this.SPRITE_MAX; i++)
        {
            this.sprite[i] = new SpriteCompornent();
            this.sprite_Z.push([i, 0]);
        }

        console.log("Sprite init succeeded");
    }

    static set(imageHndl=-1, u=0, v=0, w=16, h=16): number
    {
        for(let i=0; i<this.SPRITE_MAX; i++)
        {
            let sp=(this.nextNum+i) % this.SPRITE_MAX;

            if(this.sprite[sp].used==false)
            {
                this.sprite[sp] = new SpriteCompornent();
                this.sprite_Z[sp][1]=0;
                this.sprite[sp].used=true;
                this.sprite[sp].image = imageHndl;
                this.sprite[sp].u = u;
                this.sprite[sp].v = v;
                this.sprite[sp].width=w;
                this.sprite[sp].height=h;

                this.sprite[sp].colliderWidth=w;
                this.sprite[sp].colliderHeight=h;

                this.nextNum=sp+1;
                return sp;
            }
        }

        return -1;
    }

    static reverse(sp, rev=true): void
    {
        this.sprite[sp].reverse = rev;
    }
    static image(sp, imageHndl=undefined, u=undefined, v=undefined, w=undefined, h=undefined): void
    {
        if (imageHndl!==undefined) this.sprite[sp].image = imageHndl;
        if (u!==undefined) this.sprite[sp].u = u;
        if (v!==undefined) this.sprite[sp].v = v;
        if (w!==undefined) this.sprite[sp].width = w;
        if (h!==undefined) this.sprite[sp].height = h;
    }

    static offset(sp, x, y, z=undefined): void
    {
        this.sprite[sp].x = x;
        this.sprite[sp].y = y;
        if (z!==undefined) 
        {
            this.sprite_Z[sp][1] = z;
        }
    }
    static screenXY(sp): Array<number>
    {
        let x=this.sprite[sp].x + this.linkDifference_X(sp);
        let y=this.sprite[sp].y + this.linkDifference_Y(sp);
        return [x, y];
    }

    static belong(sp, cls=undefined): any
    {
        if (cls==undefined) return this.sprite[sp].belong;
        this.sprite[sp].belong = cls;
    }

    static link(sp, link): void
    {
        this.sprite[sp].link = link
    }

    static linkDifference_X(sp): number
    {
        if(this.sprite[sp].link != -1){
            let spli = this.sprite[sp].link;
            return this.sprite[spli].x + this.linkDifference_X(spli);
        }else{
            return 0
        }
    }
    static linkDifference_Y(sp): number
    {
        if(this.sprite[sp].link != -1){
            let spli = this.sprite[sp].link;
            return this.sprite[spli].y + this.linkDifference_Y(spli);
        }else{
            return 0
        }
    }

    static blendPal(sp: number, pal256: number)
    {
        this.sprite[sp].blendPal=pal256/255;
    }

    static update(sp, func): void
    {
        this.sprite[sp].update = func;
    }
    static DrawingProcess(sp,func): void
    {
        this.sprite[sp].drawing = func;
    }

    //クリアしないようにする
    static protect(sp: number, protect: boolean): void
    {
        this.sprite[sp].isProtect = protect;
    }

    static clear(sp: number, protect: boolean = false): void
    {
        if (protect && this.sprite[sp].isProtect) return; 
        this.sprite[sp].used = false;
        this.nextNum = sp+1;
    }

    static allClear(protect: boolean=false)
    {
        for(let i=0; i<this.SPRITE_MAX; i++)
        {
            if (protect && this.sprite[i].isProtect) continue; 
            this.sprite[i].used = false;
        }    
}


    static collider(sp, x=undefined, y=undefined, w=undefined, h=undefined, mask=undefined): void
    {
        if (x!==undefined) this.sprite[sp].x = x;
        if (y!==undefined) this.sprite[sp].y = y;
        if (w!==undefined) this.sprite[sp].width = w;
        if (h!==undefined) this.sprite[sp].height = h;
        if (mask!==undefined) this.sprite[sp].mask = mask;
    }

    static hitRectangle(x, y, width, height, mask, min=0, max=this.SPRITE_MAX): number
    {
        let x1=x, y1=y, w1=width, h1=height;
        //console.log(min+","+max);
        for(let i=min; i<max; i++)
        {
            if (this.sprite[i].used==true && (this.sprite[i].mask & mask)!=0)
            {
                let x2=this.sprite[i].x + this.linkDifference_X(i) + this.sprite[i].colliderX;
                let y2=this.sprite[i].y + this.linkDifference_Y(i) + this.sprite[i].colliderY;
                let w2=this.sprite[i].width;
                let h2=this.sprite[i].height;

                if ((Math.abs(x2-x1)<w1/2+w2/2)
                    &&
                    (Math.abs(y2-y1)<h1/2+h2/2))
                    {
                        return i;
                    }
            }
        }
    }



    static usedRate(): string
    {
        let c=0;
        for(let i=0; i<this.SPRITE_MAX; i++)
        {
            if (this.sprite[i].used) c+=1;
        }
        return c+" / "+this.SPRITE_MAX;
    }


    static allUpdate(): void
    {
        for(let i=0; i<this.SPRITE_MAX; i++)
        {
            if(this.sprite[i].used==true) {
                this.callIndex = i;
                this.sprite[i].update();
                //console.log(this.sprite[i]);   
            }
        }
    }

    static allDrawing(): void
    {
        let ol = this.sprite_Z.slice();
        ol.sort(function(a, b){return b[1]-a[1]});
        for (let i in ol)
        {
            let sp = ol[i][0];
            if(this.sprite[sp].used==true)
            {

                let x, y;
                if(this.sprite[sp].link!=-1)
                {
                    x=(this.sprite[sp].x + this.linkDifference_X(sp)) | 0;
                    y=(this.sprite[sp].y + this.linkDifference_Y(sp)) | 0;
                }
                else
                {
                    x=(this.sprite[sp].x) | 0
                    y=(this.sprite[sp].y) | 0
                }
                x *= this.roughScale;
                y *= this.roughScale;
                this.callIndex = sp;
                context.globalAlpha = this.sprite[sp].blendPal;
                this.sprite[sp].drawing(x, y);
            }

        }
    }

    static Drawing = class
    {
        static rough(x, y)
        {
            let sp=Sprite.callIndex;
            Sprite.Drawing.draw(sp, x, y, Sprite.roughScale);
        }
        static detail(x, y)
        {
            let sp=Sprite.callIndex;
            Sprite.Drawing.draw(sp, x, y, 1);
        }
        static draw(sp, x, y, scale)
        {
            if (Sprite.sprite[sp].image==-1) return;
            let spr=Sprite.sprite[sp];
            Graph.drawGraph(x, y, spr.u, spr.v, spr.width, spr.height, spr.image, scale);
        }
    }


}


//グラフィック読み込み
class Graph
{
    static images_={}
    static imageIndex_=0;
    //画像読み込み
    static loadGraph(path)
    {
        let handler=this.imageIndex_;
        this.images_[handler] = new Image;
        this.images_[handler].src=path;
        this.imageIndex_++;
        return handler;
    }
    //描画
    static drawGraph(x, y, u, v, w, h, handle, scale)
    {
        context.drawImage(this.images_[handle], u, v, w, h, x, y, w*scale, h*scale);
    }
}


class Sound
{
    static playSoundFile(path, vol=0.5, loop: boolean=false): HTMLAudioElement
    {
        let music: HTMLAudioElement = new Audio(path);
        music.volume=vol;
        music.loop = false;
        music.play();

        if (loop) 
        {
            music.addEventListener("ended", function () {
                music.currentTime = 0;
                music.play();
              }, false);
        }

        return music;
    }
}












