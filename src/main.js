var main = function(game) {};

var game = new Phaser.Game(700, 700, Phaser.AUTO, "");

game.state.add("MainMenu", mainMenu);
game.state.add("PlayGame", playGame);
game.state.add("Ending", ending);

game.state.start("MainMenu");