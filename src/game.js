/*
planets-wekazaji
A basic ring physics tutorial to build off

source: https://phaser.io/news/2015/07/simulate-planet-gravity-with-box2d-tutorial
 */
var playGame = function(game){};

var game;

// groups containing crates and planets
// var crateGroup;
var planetGroup;
var cursors;

//for the player & walk animations
var player;
var walkR;
var walkL;
var stand;
var fall;

var scoreCaption;
var score = 0;

// a force reducer to let the simulation run smoothly
var forceReducer = 0.0175; //was .005
var vel = 25;

var fuelTimer = 0;
var planetContact = false;

// graphic object where to draw planet gravity area
var gravityGraphics;

// window.onload = function(){
//     game = new Phaser.Game(800, 800, Phaser.AUTO, "");
//     game.state.add("PlayGame",playGame);
//     game.state.start("PlayGame");
// };

playGame.prototype = {
    preload: function () {
        game.load.image("crate", "assets/crate.png");
        game.load.image("planet", "assets/planet.png");
        game.load.image("bigplanet", "assets/bigplanet.png");
        game.load.image('dude', 'assets/dude.png');
        game.load.spritesheet('player',"assets/nebspritesv2.5.png",40,47);
        game.load.spritesheet('gear', 'assets/gearspritessmall.png',38,34);
    },
    create: function () {
        var enemy;
        var gearGroup;

        // new boundaries are centered on 0,0 so the world can rotate
        game.world.setBounds(-400, -300, 400, 300);

        game.time.desiredFps = 20;
        fuelTimer = game.time.now;

        // adding groups
        // crateGroup = game.add.group();
        planetGroup = game.add.group();
        objectGroup = game.add.group();

        // adding graphic objects
        gravityGraphics = game.add.graphics(0, 0);
        gravityGraphics.lineStyle(2, 0xffffff, 0.5);

        // stage setup
        game.stage.backgroundColor = "#222222";

        // physics initialization
        game.physics.startSystem(Phaser.Physics.BOX2D);

        /* adding a couple of planets. Arguments are:
         * x position, y position, gravity radius, gravity force, graphic asset */
        addPlanet(-280, -100, 250, 150, "planet");
        addPlanet(130, 150, 400, 250, "bigplanet");

        // waiting for player input
        // game.input.onDown.add(addCrate, this);
        player = game.add.sprite(100, 120, "player");
        game.physics.box2d.enable(player);
        player.frame = 4;
        walkR = player.animations.add('walkR',[5,6,7,8], 7, true);
        walkL = player.animations.add('walkL', [0,1,2,3], 7, true);
        stand = player.animations.add('stand',[4],1);
        fall = player.animations.add('fall',[9],1);

        //add enemy - crate
        enemy = game.add.sprite(120, 120, 'crate');
        game.physics.box2d.enable(enemy);
        enemy.body.setRectangle(12, 12);
        objectGroup.add(enemy);

        // add gearGroup
        gearGroup = game.add.group();
        gearGroup.enableBody = true;
        gearGroup.physicsBodyType = Phaser.Physics.BOX2D;

        for (var i = 0; i < 5; i++) //add random 10 gears
        {
            var gear = game.add.sprite(game.world.randomX, game.world.randomY, 'gear');
            gearGroup.add(gear);
            objectGroup.add(gear);
            game.physics.box2d.enable(gear);
            gear.body.setCollisionCategory(2);
            // gear.body.sensor = true;
            gear.body.static = false;
            gear.animations.add(0,1,2,3);
        }
        player.body.setCategoryContactCallback(2, gearCallback, this);
        scoreCaption = game.add.text(300, 300, 'Score: ' + score, { fill: '#ffaaaa', font: '14pt Arial'});
        scoreCaption.fixedToCamera = true;

        player.body.setCategoryContactCallback(1,planetContactCallback,this);

        // get keyboard input
        cursors = game.input.keyboard.createCursorKeys();
        //camera follows the player
        game.camera.follow(player);
    },

    update: function(){

        // console.log('planet contact', planetContact);

        var angle = gravityRadius(player);
        if (angle > -361){ // angle == -361 if the player is not in any gravity field.
            //orients players feet toward the ground. Uses var angle as degrees offset by -90
            player.body.angle = angle * 180 / Math.PI - 90;
        }

        objGrav();

        game.world.pivot.x = player.x;
        game.world.pivot.y = player.y;
        game.world.rotation = -angle + (Math.PI/2);

        //Handle keyboard input for the player
        if (cursors.left.isDown ) {
            // player.body.moveLeft(90);
            player.body.velocity.x += vel * Math.cos(angle + (Math.PI/2));
            player.body.velocity.y += vel * Math.sin(angle + (Math.PI/2));
            player.animations.play('walkL');
        }
        else if (cursors.right.isDown ) {
            // player.body.moveRight(90);
            player.body.velocity.x += vel * Math.cos(angle - (Math.PI / 2)) ;
            player.body.velocity.y += vel * Math.sin(angle - (Math.PI / 2)) ;
            player.animations.play('walkR');
        }
        if (cursors.up.isDown) {
            if (fuelTimer === 0 && planetContact === true) { //start the jump
                player.body.velocity.x += -vel * Math.cos(angle);
                player.body.velocity.y += -vel * Math.sin(angle);
                player.animations.play('fall');
                fuelTimer = 1;
            }else if (fuelTimer > 0 && fuelTimer < 20){
                planetContact = false;
                fuelTimer++;        //jump for 10 cycles. holding jump increases upward velocity.
                player.body.velocity.x += -vel * Math.cos(angle);
                player.body.velocity.y += -vel * Math.sin(angle);
                player.animations.play('fall');
                console.log('up', fuelTimer, planetContact);
            }
        }

        if (cursors.down.isDown) {
            if (fuelTimer === 0) {
                player.body.velocity.x += vel * Math.cos(angle);
                player.body.velocity.y += vel * Math.sin(angle);
                player.animations.play('stand');
                fuelTimer = 1;
            }else if (fuelTimer > 0 && fuelTimer < 25){
                fuelTimer ++;
                player.body.velocity.x += (vel*fuelTimer) * Math.cos(angle);
                player.body.velocity.y += (vel*fuelTimer) * Math.sin(angle);
                player.animations.play('stand');
                console.log('down', fuelTimer);
            }
        }

        if (cursors.up.justUp || cursors.down.justUp){ //resets fuel timer for up/down motion via jetpack
            fuelTimer = 0;
        }

        constrainVelocity(player,150);

    },

    render: function() {
        game.debug.cameraInfo(game.camera, 32, 32);
        game.debug.spriteCoords(player, 32, 500);

    }
};

// function to add a crate
// function addCrate(e){
//     var crateSprite = game.add.sprite(e.x, e.y, "crate");
//     crateGroup.add(crateSprite);
//     game.physics.box2d.enable(crateSprite);
// }

/*
This is the code that calculates gravity fields for the player, if they are in the radius.
I changed it so that this function returns -361, which is impossible in radian angles,
if the player is not in any gravity radius.
 */
function gravityRadius(player){
    var distance;
    var angle = -361;
    // looping through all planets
    for (var j = 0; j < planetGroup.total; j++) {
        var p = planetGroup.getChildAt(j);

        // calculating distance between the planet and the crate
        distance = Phaser.Math.distance(player.x, player.y, p.x, p.y);

        // checking if the distance is less than gravity radius
        if (distance < p.width / 2 + p.gravityRadius / 2) {

            // calculating angle between the planet and the crate
            angle = Phaser.Math.angleBetween(player.x, player.y, p.x, p.y);

            // add gravity force to the crate in the direction of planet center
            player.body.applyForce(p.gravityForce * Math.cos(angle) * forceReducer,
                p.gravityForce * Math.sin(angle) * forceReducer);
        }
    }
    return angle;
}

function objGrav(){

    for (var i = 0; i < objectGroup.total; i++){
        var o = objectGroup.getChildAt(i);
        gravityRadius(o);
    }
}

/*
 This function implements a max velocity on a sprite, so it cannot accelerate too far and fly out of a
 gravity field. Code from : http://www.html5gamedevs.com/topic/9835-is-there-a-proper-way-to-limit-the-speed-of-a-p2-body/
 */
function constrainVelocity(sprite, maxVelocity) {
    var body = sprite.body;
    var angle, currVelocitySqr, vx, vy;
    vx = body.velocity.x;
    vy = body.velocity.y;
    currVelocitySqr = vx * vx + vy * vy;
    if (currVelocitySqr > (maxVelocity * maxVelocity)) {
        angle = Math.atan2(vy, vx);
        vx = Math.cos(angle) * maxVelocity;
        vy = Math.sin(angle) * maxVelocity;
        body.velocity.x = vx;
        body.velocity.y = vy;
        // console.log('limited speed to: '+ maxVelocity);
    }
}

// function to add a planet
function addPlanet(posX, posY, gravityRadius, gravityForce, asset){
    var planet = game.add.sprite(posX, posY, asset);
    planet.gravityRadius = gravityRadius;
    planet.gravityForce = gravityForce;
    planetGroup.add(planet);
    game.physics.box2d.enable(planet);
    planet.body.static = true;

    // look how I create a circular body
    planet.body.setCircle(planet.width / 2);
    gravityGraphics.drawCircle(planet.x, planet.y, planet.width+planet.gravityRadius);
    planet.body.setCollisionCategory(1);

}

// kills the gear when touched
function gearCallback(body1,body2, fixture1, fixture2, begin) {
    //body1, body2, fixture1, fixture2, begin
    // body1 is the player because it's the body that owns the callback
    // body2 is the body it impacted with, in this case the gear
    // fixture1 is the fixture of body1 that was touched
    // fixture2 is the fixture of body2 that was touched

    // This callback is also called for EndContact events, which we are not interested in.
    if (!begin)
    {
        return;
    }
    score += 100;
    scoreCaption.text = 'Score: ' + score;
    body2.sprite.destroy();
}

function planetContactCallback(body1, body2, fixture1, fixture2, begin){
    if (!begin){
        return;
    }

    planetContact =  true;
}
