var Helper = function(game){

    var messageBack;
    var messageCaption;

    /*=============================================================================
       HELPER FUNCTIONS
    =============================================================================*/

//=======Messages================================================================================================
    this.addMessage = function(text, delay){
        //add score to the screen
        if(lastCaption !== text || game.time.events.duration === 0) {
            messageBack = game.add.sprite(1000, 1000, "log");
            messageBack.scale.setTo(0.5, 0.5);
            messageBack.anchor.set(0.5);
            messageCaption = game.add.text(1000, 1000, text, {fill: '#72fa80', font: '10pt Courier'});
            messageCaption.anchor.set(0.5);
            messageGroup.add(messageBack);
            messageGroup.add(messageCaption);
            lastCaption = text;
            console.log("add message with delay:,", delay);
            if (delay > 0) {
                messageTimer(delay); //fades message
            }
        }
    };

    function messageTimer(delay){
        game.time.events.add(Phaser.Timer.SECOND * delay, fadeMessage, this);
    }

    function fadeMessage(){
        console.log("start FADE MESSAGE");
        var bubbleTween = game.add.tween(messageBack).to( { alpha: 0 }, 1000, Phaser.Easing.Linear.None, true);
        var textTween = game.add.tween(messageCaption).to( { alpha: 0 }, 1000, Phaser.Easing.Linear.None, true);
        bubbleTween.onComplete.add(destroyMessage, this);
        textTween.onComplete.add(destroyMessage, this);
    }

    function destroyMessage(){
        messageGroup.remove(messageBack);
        messageGroup.remove(messageCaption);
        messageBack.destroy();
        console.log("destroyed messageBack");
        messageCaption.destroy();
        console.log("destroyed caption");
    }

    this.messageLocation = function(angle) {
        if(messageBack !== null) {
            messageBack.x = player.x - 190 * Math.cos(angle);
            messageBack.y = player.y - 190 * Math.sin(angle);
            messageCaption.x = player.x - 190 * Math.cos(angle);
            messageCaption.y = player.y - 190 * Math.sin(angle);
            messageBack.angle = angle * 180 / Math.PI - 90;
            messageCaption.angle = angle * 180 / Math.PI - 90;
        }
    };

//=======================================================================================================
//  ========== CONTACT CALLBACKS ========================================

//rebounds the player sprite back after enemy collision
    //rebounds the player sprite back after enemy collision
    this.enemyContactCallback = function(body1, body2, fixture1, fixture2, begin) {
        if (!begin) {
            return;
        }
       // console.log("callback");
        if (enemyCounterClockwise === -1) {
            enemyCounterClockwise = 0;
        } else {
            enemyCounterClockwise = -1;
        }
        enemyCollision = true;

        // helper.resetLevel();
        helper.deadByEnemy();
    };


// kills the gear when touched
    this.gearCallback = function(body1, body2, fixture1, fixture2, begin) {
        //body1, body2, fixture1, fixture2, begin
        // body1 is the player because it's the body that owns the callback
        // body2 is the body it impacted with, in this case the gear
        // fixture1 is the fixture of body1 that was touched
        // fixture2 is the fixture of body2 that was touched

        // This callback is also called for EndContact events, which we are not interested in.
        if (!begin) {
            return;
        }
        var ting = game.add.audio('ting');
        ting.volume = 0.6;
        ting.play();
        score += 1;
        helper.addMessage(score + " / " + levelGoal, 0.7);
        if (score >= levelGoal) {
            teleporter.animations.play('swirl');
            var teleporterOpenSound = game.add.audio("teleporterOpen");
            teleporterOpenSound.play();
        }
        body2.sprite.destroy();
    };


    this.startPadContactCallback = function(body1,body2,fixture1,fixture2,begin){
        if (!begin){
            return;
        }
        //console.log("platform");
        game.time.events.add(Phaser.Timer.SECOND* 0.6, levelChanger.fadeStartPad, this);
    };


    this.checkTeleporterOverlap = function(teleporter) {
        if (levelComplete === false){
            console.log("overlap called");
            var teleporterBounds = teleporter.getBounds();
            var playerBounds = player.getBounds();
            if (Phaser.Rectangle.contains(teleporterBounds, playerBounds.centerX, playerBounds.centerY)){
                console.log('teleporter CONTACT');
                if(score < levelGoal) {
                    this.addMessage("This portal is broken.\nCollect gears to repair.", 3);
                } else {
                    levelComplete = true;
                    levelChanger.changeLevel();
                }
            }
        }
    };

//==============================================================================================================
    // ==================== OTHER HELPER FUNCTIONS ==============================

    this.handleKeyboardInput = function(angle) {
        if (cursors.left.isDown) {
            // player.body.moveLeft(90);
            player.body.velocity.x += playerVel * Math.cos(angle + (Math.PI / 2));
            player.body.velocity.y += playerVel * Math.sin(angle + (Math.PI / 2));
            player.animations.play('walkL');
        }
        else if (cursors.right.isDown) {
            // player.body.moveRight(90);
            player.body.velocity.x += playerVel * Math.cos(angle - (Math.PI / 2));
            player.body.velocity.y += playerVel * Math.sin(angle - (Math.PI / 2));
            player.animations.play('walkR');
        }
        if (cursors.up.isDown) {
            player.body.velocity.x += -playerVel * Math.cos(angle);
            player.body.velocity.y += -playerVel * Math.sin(angle);
            player.animations.play('fall');

        }
        if (cursors.down.isDown) {
            player.body.velocity.x += playerVel * Math.cos(angle);
            player.body.velocity.y += playerVel * Math.sin(angle);
            player.animations.play('stand');

        }
        if (cursors.left.justUp || cursors.right.justUp) {
            player.animations.play('stand');
        }
    };


    this.moveDashboard = function(angle){
        for(var i = 0; i < dashboardGroup.total; i ++) {
            var d = dashboardGroup.getChildAt(i);
            d.x = player.x + 353 * Math.cos(angle);
            d.y = player.y + 353 * Math.sin(angle);
            d.angle = angle * 180 / Math.PI - 90;
        }
    };

    this.pauseGame = function(){
        pause.frame = 1;
        game.paused = true;
    };

    this.unpauseGame = function(event){
        var pauseButton = pause.getBounds();
        if(Phaser.Rectangle.contains(pauseButton,event.x,event.y)) {
            game.paused = false;
            pause.frame = 0;
        }
    };


    this.deadByEnemy = function(){
        // console.log("deadbyEnemy is called");
        // player.body.velocity.x = 0;
        // player.body.velocity.y = 0;
        // game.input.enabled = false;
        //
        // var drop = game.add.tween(player);
        // drop.to({ y: game.world.height-player.height }, 500, Phaser.Easing.Bounce.In);
        // drop.onComplete.add(helper.resetLevel, this);
        // drop.start();
        bgm.pause();
        game.world.pivot.x = 0;
        game.world.pivot.y = 0;
        game.world.rotation = 0;
        game.camera.reset();
        game.state.start("DeadState", true, false, 0);
    };
};