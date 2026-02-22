// ---------- NFC Retro Bowl-Style Play Mode ----------

const teams = [
  {name:"DET", color:0x00b0f0, alt:0xb0b7bc},
  {name:"ARI", color:0xff0000},
  {name:"ATL", color:0xa50000},
  {name:"CAR", color:0x0088ff},
  {name:"CHI", color:0x000080},
  {name:"DAL", color:0x0078d7},
  {name:"GB", color:0xffcc00},
  {name:"LA", color:0x003087},
  {name:"MIN", color:0x4f2683},
  {name:"NO", color:0xd3bc8d},
  {name:"NYG", color:0x0b2265},
  {name:"PHI", color:0x004c54},
  {name:"SF", color:0xc8102e},
  {name:"SEA", color:0x69be28},
  {name:"TB", color:0xd50a0a},
];

let playerTeam = 0;
let cpuTeam = 1;

const config = {
  type: Phaser.AUTO,
  width: 900,
  height: 500,
  backgroundColor: "#2e8b57",
  physics: { default: "arcade" },
  scene: [Menu, Game]
};

new Phaser.Game(config);

// ---------- MENU SCENE ----------
function Menu() { Phaser.Scene.call(this,{key:"menu"});}
Menu.prototype = Object.create(Phaser.Scene.prototype);

Menu.prototype.create = function(){
  this.add.text(450,40,"PIXEL FOOTBALL NFC",{fontSize:"32px",fill:"#fff"}).setOrigin(0.5);

  this.playerRect = this.add.rectangle(250,200,80,80,teams[playerTeam].color);
  this.playerText = this.add.text(250,200,teams[playerTeam].name,{fontSize:"24px",fill:"#fff"}).setOrigin(0.5);
  this.cpuRect = this.add.rectangle(650,200,80,80,teams[cpuTeam].color);
  this.cpuText = this.add.text(650,200,teams[cpuTeam].name,{fontSize:"24px",fill:"#fff"}).setOrigin(0.5);

  this.add.text(150,200,"<",{fontSize:"32px",fill:"#fff"}).setInteractive().on("pointerdown",()=>{playerTeam=(playerTeam+teams.length-1)%teams.length; this.updateTeams();});
  this.add.text(350,200,">",{fontSize:"32px",fill:"#fff"}).setInteractive().on("pointerdown",()=>{playerTeam=(playerTeam+1)%teams.length; this.updateTeams();});
  this.add.text(550,200,"<",{fontSize:"32px",fill:"#fff"}).setInteractive().on("pointerdown",()=>{cpuTeam=(cpuTeam+teams.length-1)%teams.length; this.updateTeams();});
  this.add.text(750,200,">",{fontSize:"32px",fill:"#fff"}).setInteractive().on("pointerdown",()=>{cpuTeam=(cpuTeam+1)%teams.length; this.updateTeams();});

  this.add.text(450,360,"START GAME",{fontSize:"32px",fill:"#ffff00"}).setOrigin(0.5).setInteractive().on("pointerdown",()=>this.scene.start("game"));
};

Menu.prototype.updateTeams=function(){
  this.playerRect.setFillStyle(teams[playerTeam].color);
  this.playerText.setText(teams[playerTeam].name);
  this.cpuRect.setFillStyle(teams[cpuTeam].color);
  this.cpuText.setText(teams[cpuTeam].name);
};

// ---------- GAME SCENE ----------
function Game(){ Phaser.Scene.call(this,{key:"game"});}
Game.prototype = Object.create(Phaser.Scene.prototype);

Game.prototype.create=function(){
  this.scorePlayer=0; this.scoreCPU=0;
  this.scoreText=this.add.text(400,20,"0 - 0",{fontSize:"24px",fill:"#fff"});
  this.messageText=this.add.text(450,240,"",{fontSize:"48px",fill:"#ffff00"}).setOrigin(0.5);

  // Field
  this.fieldWidth=1600;
  this.cameras.main.setBounds(0,0,this.fieldWidth,500);
  this.physics.world.setBounds(0,0,this.fieldWidth,500);

  // End zones
  this.leftEnd=this.add.rectangle(25,250,50,500,0x4444ff).setOrigin(0.5);
  this.rightEnd=this.add.rectangle(this.fieldWidth-25,250,50,500,0xff4444).setOrigin(0.5);

  // Hash marks every 10 yards
  let yardPixel=5;
  for(let yard=10; yard<this.fieldWidth/yardPixel; yard+=10){
    let x = yard*yardPixel;
    this.add.line(x, 5, x, 15, 0xffffff, 1).setOrigin(0,0);
    this.add.line(x, 485, x, 495, 0xffffff, 1).setOrigin(0,0);
  }

  // Yard lines every 50 yards
  for(let yard=50; yard<this.fieldWidth/yardPixel; yard+=50){
    let x = yard*yardPixel;
    this.add.line(x, 0, x, 500, 0xffffff, 0.3).setOrigin(0,0);
  }

  // Sidelines
  this.add.rectangle(this.fieldWidth/2, 5, this.fieldWidth, 2, 0xffffff);
  this.add.rectangle(this.fieldWidth/2, 495, this.fieldWidth, 2, 0xffffff);

  // QB
  this.player=this.add.container(150,250);
  this.createPlayerSprite(this.player,teams[playerTeam].color);
  this.physics.add.existing(this.player);
  this.player.body.setImmovable(true);

  // Offensive line (vertical in front of QB)
  this.offense=[];
  for(let i=0;i<4;i++){
    let ol=this.add.container(200,200+i*50);
    this.createPlayerSprite(ol,0xaaaaaa);
    this.physics.add.existing(ol);
    ol.body.setImmovable(true);
    this.offense.push(ol);
  }

  // WRs (same vertical line, move right automatically after Hut)
  this.receivers=[];
  for(let i=0;i<2;i++){
    let r=this.add.container(300,200+i*50);
    this.createPlayerSprite(r,0xffff00);
    this.physics.add.existing(r);
    r.speedX=50;  // pixels per second
    r.hasBall=false;
    r.routeStarted=false;
    this.receivers.push(r);
  }

  // CPU defenders
  this.defenders=[];
  for(let i=0;i<2;i++){
    let d=this.add.container(700,200+i*50);
    this.createPlayerSprite(d,teams[cpuTeam].color);
    this.physics.add.existing(d);
    d.routeStarted=false;
    this.defenders.push(d);
  }

  // Ball
  this.ball=this.add.ellipse(this.player.x+20,this.player.y,10,6,0x8b4513);
  this.ballLaces=this.add.rectangle(this.ball.x,this.ball.y,6,1,0xffffff);
  this.physics.add.existing(this.ball);
  this.ball.body.setAllowGravity(false);
  this.ball.active=false;
  this.ball.target=null;
  this.ball.speed=200; // slower

  // Keys
  this.keys=this.input.keyboard.addKeys({up:'W',down:'S',hut:'E',run:'Q'});

  // Hut key
  this.keys.hut.on('down', ()=>{
    this.receivers.forEach(r=> r.routeStarted=true);
    this.defenders.forEach(d=> d.routeStarted=true);
    this.tweens.add({targets:this.player, x:this.player.x-30, duration:300});
  });

  // Pointer dots
  this.aimDots=[];
  for(let i=0;i<20;i++){
    let dot=this.add.circle(0,0,2,0xffffff);
    dot.visible=false;
    this.aimDots.push(dot);
  }

  this.input.on('pointermove', pointer=>{
    if(!this.ball.active){
      let startX=this.player.x+20, startY=this.player.y;
      for(let i=0;i<this.aimDots.length;i++){
        let t=(i+1)/this.aimDots.length;
        let x=startX + (pointer.worldX - startX)*t;
        let y=startY + (pointer.worldY - startY)*t;
        this.aimDots[i].x=x; this.aimDots[i].y=y; this.aimDots[i].visible=true;
      }
    }
  });

  this.input.on('pointerdown', pointer=>{
    if(!this.ball.active){
      let nearest=this.receivers.reduce((prev,curr)=>{
        return Phaser.Math.Distance.Between(curr.x,curr.y,pointer.worldX,pointer.worldY)<
               Phaser.Math.Distance.Between(prev.x,prev.y,pointer.worldX,pointer.worldY)?curr:prev;
      });
      this.ball.active=true;
      this.ball.target=nearest;
      // hide dots immediately
      this.aimDots.forEach(dot=>dot.visible=false);
    }
  });

  this.cameras.main.startFollow(this.player);
};

// ---------- UPDATE ----------
Game.prototype.update=function(){
  let delta=this.game.loop.delta/1000;
  let activePlayer=this.receivers.find(r=>r.hasBall);

  // Receiver automatic right movement
  this.receivers.forEach(r=>{
    if(r.routeStarted && !r.hasBall) r.x += r.speedX*delta;

    // Vertical control after catch
    if(r.hasBall){
      r.body.setVelocityY(0);
      if(this.keys.up.isDown) r.body.setVelocityY(-50);
      if(this.keys.down.isDown) r.body.setVelocityY(50);
    }

    // Move ball with receiver
    if(r.hasBall){
      this.ball.x = r.x + 10; this.ball.y = r.y;
      this.ballLaces.x=this.ball.x; this.ballLaces.y=this.ball.y;
    }

    // Catch
    if(this.ball.active && this.ball.target===r && Phaser.Math.Distance.Between(this.ball.x,this.ball.y,r.x,r.y)<12){
      this.ball.active=false;
      r.hasBall=true;
      r.routeStarted=false;
      this.ball.x=r.x+10; this.ball.y=r.y;
      this.ballLaces.x=this.ball.x; this.ballLaces.y=this.ball.y;
    }
  });

  // CPU defenders
  this.defenders.forEach(d=>{
    if(d.routeStarted){
      let nearest=this.receivers.reduce((prev,curr)=>{
        return Phaser.Math.Distance.Between(d.x,d.y,curr.x,curr.y)<
               Phaser.Math.Distance.Between(d.x,d.y,prev.x,prev.y)?curr:prev;
      });
      this.physics.moveToObject(d,nearest,50);
    }
  });

  // Ball flight
  if(this.ball.active && this.ball.target){
    let angle=Phaser.Math.Angle.Between(this.ball.x,this.ball.y,this.ball.target.x,this.ball.target.y);
    this.ball.x += Math.cos(angle)*this.ball.speed*delta;
    this.ball.y += Math.sin(angle)*this.ball.speed*delta;
    this.ballLaces.x=this.ball.x; this.ballLaces.y=this.ball.y;
  }

  // Touchdown
  if(this.ball.x>this.fieldWidth-25){
    this.scorePlayer++;
    this.scoreText.setText(this.scorePlayer+" - "+this.scoreCPU);
    this.showMessage("TOUCHDOWN!");
    this.resetBall();
  }
};

// ---------- PLAYER SPRITES ----------
Game.prototype.createPlayerSprite=function(container,color){
  let outline=0x000000;
  let body=this.add.rectangle(0,0,12,18,color).setStrokeStyle(1,outline);
  let helmet=this.add.circle(0,-10,5,0xffffff).setStrokeStyle(1,outline);
  let stripe=this.add.rectangle(0,-10,12,2,0x000000).setStrokeStyle(1,outline);
  let leftArm=this.add.rectangle(-6,0,3,10,color).setStrokeStyle(1,outline);
  let rightArm=this.add.rectangle(6,0,3,10,color).setStrokeStyle(1,outline);
  let leftLeg=this.add.rectangle(-3,10,3,10,color).setStrokeStyle(1,outline);
  let rightLeg=this.add.rectangle(3,10,3,10,color).setStrokeStyle(1,outline);
  container.add([body,helmet,stripe,leftArm,rightArm,leftLeg,rightLeg]);
};

// ---------- MESSAGE ----------
Game.prototype.showMessage=function(text){
  this.messageText.setText(text);
  this.time.delayedCall(1000, ()=>{ this.messageText.setText(""); }, [], this);
};

// ---------- RESET ----------
Game.prototype.resetBall=function(){
  this.ball.active=false;
  this.ball.target=null;
  this.ball.x=this.player.x+20; this.ball.y=this.player.y;
  this.ballLaces.x=this.ball.x; this.ballLaces.y=this.ball.y;
  this.receivers.forEach(r=> r.hasBall=false);
  this.cameras.main.startFollow(this.player);
};