var gameVars;
var lastStats=[];

function init() {
    // $('#passages').html($('#passages').html().replace(/<br><br>/gm, ""));
    $("body").on("click",()=>
    {
        $("body").addClass("blur")
    }); 
    fade($("body"), 1);
    // setInterval(checkDif, 1000)
}


function setBackground(image) {
    // image = image || "paper.jpg"
    let { faction } = getUser();
    let imageURL = `url('Twine/images/Borders/Observer.jpg')`
    if (faction) {
        imageURL = `url('Twine/images/Borders/${faction}.jpg')`
    }

    $(() => {
        $('#story').css({
            'background-image': imageURL,
            'background-position': '30% 70%,0 0',
            'background-size': '100% 100%'
        })
    })
}


function fade(el, destination) {
    $({
        opacity: 1 - destination
    })
    .animate({
        opacity: destination
    }, {
        duration: 2000,
        step: function () {
            $(el).css({
                opacity: this.opacity
            })
        }
    });
}


$(document).on(':passagestart', (ev) => {
    let { role, faction } = getUser();
    var passage = $(ev.content).data("passage");
    var passageLength= Math.sqrt( SugarCube.Story.get(passage).text.length);
    var fs=`${Math.log(passageLength)}rem`;
    
    console.log("Passage length:", passageLength)
    //$('#passages').css({"font-size":fs})
    SugarCube.State.setVar(`$${role}_currentPassage`, passage);
    fade($("#passages"), 1);
})


/* JavaScript code */


function showMap(){
    var map = $('#map')
    if(!map.length) {
        $('#story').append($('<img/>',{
        "id":"map",
        "name":"map"
        }))
    }
    
    let { faction, role } = getUser();
    // var faction = SugarCube.State.getVar("$faction");  
    var currentMap = SugarCube.State.variables['users'][SugarCube.State.variables.userId].currentMap
    // let currentMapIndex = 0
    if (!currentMap) {
        let currentMapIndex = SugarCube.State.getVar(`$${faction}_currentMap`) || 0;
        currentMap = `${faction}_${currentMapIndex}.png`
    }
    let map_src = $('#map').attr("src")

    if(map_src != currentMap) {
        $('#map').attr("src",`Twine/images/${currentMap}`)
    }
}

function showStats() {
    let { role, faction } = getUser();
    var stats = {
        "Strength": 0,
        "Wisdom": 0,
        "Loyalty": 0
    }
   
    var displayStats = $('<div/>', {
        "id": "displayStats",
    })

    let userId = SugarCube.State.variables.userId
    let twineStats = SugarCube.State.variables.users[userId].stats



        if (twineStats) {
            Object.keys(stats).forEach((stat,idx) => {
                var twineVar = twineStats[stat]

                displayStats.append(
                    $('<div/>', {
                    "class": "stat",
                    "css":{"background-image":`url(Twine/images/Stats/${faction}_${stat}.png)`}
                }).append($('<div/>', {
                    "class": "statNum",
                    "html":twineVar || "0" 
                })))
            })

            var dispLayStatsDOM = $('#displayStats')

            if(!dispLayStatsDOM.length){
                $('#story').append(displayStats)
            }
            else{
                dispLayStatsDOM.replaceWith(displayStats)
            }
        }

        let twineVar = SugarCube.State.variables[`${faction}_strength`];
        // let twineVar = 7
        if(twineVar) { 
            let statString = `${faction}: ${twineVar} `;
        if(!$('#factionStrength').length){
            $('#story')
                .append($('<div/>', 
                    {
                        "id": "factionStrength",
                    })
                    .append(
                        $('<div/>', {
                        "id": "factionStrengthBar",
                        // "html": statString
                    }))
                ).append($('<div/>', {
                    "id": "factionStrengthLabel",
                   // "html": statString
                }))
            }
            $("#factionStrengthLabel").html(statString);
            setFactionStrength(twineVar)  // set back to twineVar
        }
    
}


function setFactionStrength(rawValue) {
    var maxValue=14;
    var value=rawValue/maxValue*100;
    console.log({value, rawValue});


        let gradientMask= `linear-gradient(90deg, black 0%, black ${Math.floor(value)}%, transparent ${Math.min(100,value+10)}%)`;
        let  maskStyle=`-webkit-mask-image:${gradientMask};mask-image:${gradientMask};`;
        console.log(maskStyle)
        $("#factionStrengthBar").attr("style",maskStyle)
   
}

function makeRoleStats(statsIn) {
    var total = 0;
    let { role } = getUser();
    let userId = SugarCube.State.variables.userId;
    let user = SugarCube.State.variables.users[userId]
    var output = "";

    user["stats"] = statsIn;

    Object.keys(statsIn).forEach((stat) => {
            val = parseInt(statsIn[stat]);
           // SugarCube.State.variables[`${role}_${stat}`] = val;
            output += `${stat}: ${val}\n`;
        } 
    )
    $('#statsPicker').html(output)

    // return output;
    showStats()
}


function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function changeStats(rolePlay,newStats){
    let curerentUser = Object.keys(SugarCube.State.variables.users).find(user=>user.role==rolePlay)

    let roleStats = SugarCube.State.variables.roles[rolePlay].stats

    Object.keys(roleStats).forEach((stat, idx) => {
        roleStats[stat] = parseInt(newStats[stat]) + parseInt(roleStats[stat])
    });
}






// Returns the role of the current player
function getUser() {
    let userId = SugarCube.State.getVar("$userId");
    // console.log("STATE:", SugarCube.State.variables);
    let user = SugarCube.State.getVar("$users")[userId];
    return user;
}

