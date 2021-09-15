// Lock the loading screen
var gameVars;
$(document).ready(function () {
var isOnline= new RegExp('apps\.tlt\.stonybrook\.edu').test(window.location);
console.log(isOnline)
if(isOnline){
online();

}

else{
offline();

}

});

function offline(){

}


function online()
{

    if(email==""){
        window.location="login"
        
            }
            $.get("roles.php", loadRole);

}



function init() {

    setInterval(checkDif, 1000)
}


function checkDif() {
    var dif= {};
    var sugarVars = SugarCube.State.variables
    delete sugarVars.role;
    delete sugarVars.faction;
    delete sugarVars.isLeader;
    delete sugarVars.character;
    for (i in sugarVars) {
        if (sugarVars[i] != gameVars[i])
            dif[i] = sugarVars[i];


    }
    gameVars=Object.assign({}, sugarVars);
    if (!$.isEmptyObject(dif))
    {
        $.post("updateBatch.php",dif);


    }
}



function loadRole(data) {

    //  var email = SugarCube.State.getVar("$email");
    var roles = $.csv.toObjects(data);
    console.log(roles)
    var role = "Player"
    var foundRole = roles.find((item) => item.email == email)

    if (foundRole) {
        role = foundRole.role

    }

    SugarCube.State.setVar("$role", role);

    $.get("roleInfo.php", (data) => loadRoleInfo(data, role))


}

function loadRoleInfo(data, role) {
    var roleInfo = $.csv.toObjects(data);
    var faction = "Observer";
    var isLeader = false;
    var character ="Observer"
    var foundRoleInfo = roleInfo.find((item) => item.Role == role)
    if (foundRoleInfo) {
        console.log(foundRoleInfo)
         faction = foundRoleInfo.Faction;
         isLeader = foundRoleInfo.isLeader.toLowerCase();
         character = foundRoleInfo.Character

    }
    SugarCube.State.setVar("$faction", faction);
    SugarCube.State.setVar("$isLeader", isLeader);
    SugarCube.State.setVar("$character", character);
    $.get("gameState.php", loadGameData);


}



function loadGameData(data) {
    var vars = $.csv.toObjects(data)[0];
    gameVars = vars;

    for (key in vars) {
        console.log(key, vars[key])
        SugarCube.State.setVar("$" + key, vars[key]);
    }

    console.log(SugarCube.State.variables)
    SugarCube.Engine.play(vars["currentPassage"])
    init();

}