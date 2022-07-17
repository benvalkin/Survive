import {init} from './Main.js'

let headerDiv = document.getElementById("headerDiv")

// the button that loads the game
let loadLevel1 = document.getElementById("level1")
let loadLevel2 = document.getElementById("level2")

loadLevel1.onclick = function(){
    loadLevel1.style.visibility = 'hidden'
    loadLevel2.style.visibility = 'hidden'
    init("level1");
}

loadLevel2.onclick = function(){
    loadLevel1.style.visibility = 'hidden'
    loadLevel2.style.visibility = 'hidden'
    init("level2");
}