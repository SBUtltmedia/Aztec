function statPickerInit() {
    console.log("statPickerInit: Fired");
    var statNames = ["Strength", "Wisdom", "Loyalty"]
    var userId = SugarCube.State.getVar("$role");
    console.log("statPickerInit: userId from $role:", userId);
    var users = SugarCube.State.getVar("$users");
    var user = users ? users[userId] : undefined;
    console.log("statPickerInit: user object:", user);

    if (!user) {
        console.error("statPickerInit: User object not found for role:", userId);
        return "";
    }

    let stats = user.stats;
    console.log("statPickerInit: user.stats:", stats);
    if (stats) {
        setTimeout(toggleHide,1000);
        return "";
    }

    var pointsLeftLabel= $('<span/>',{html:"Points to assign: "})
    var pointsLeft = $("<span/>", {
        "id": "currentValue",
        "html": 20,
     
    });

    var container = $("<div/>", {
        "id": "stats"
    });

    statNames.forEach((stat) => makeStats(stat, container));

    var submitButton = $("<input/>", {
        "id": "submitButton",
        "value": "submit stats",
        type: "submit"
    });
    var newline = $("<br/>")
    container.append([newline]);

    var dialog = $("<div/>", {
        "id": "dialog-confirm",
        html: ""
    });

    var out = $("<div/>", {
        "class": "show"
    }).append([pointsLeftLabel,pointsLeft, container, submitButton, dialog])

    

    setTimeout(() => {
        $('#statsPicker').empty().append(out)


        $("#submitButton").on("click", submitStats)
        $('#stats input[type="number"]').niceNumber({
            onIncrement: ($currentInput, amount, settings) => changeHelper($currentInput, amount, 1),
            onDecrement: ($currentInput, amount, settings) => changeHelper($currentInput, amount, -1),
        });

        // Add input event listener to update points counter when user types directly
        $('#stats input[type="number"]').on('input', function() {
            updatePointsCounter();
        });

        disableButtons();

    }, 500);
    return ""
}

function changeHelper($currentInput, amount, direction) {
    var currentValue = parseInt($("#currentValue").text(), 10);
    var updatedValue = currentValue - direction;
    
    // Prevent going below 0 points remaining or above 20
    if (updatedValue < 0 && direction > 0) {
        // Trying to use more points than available
        $currentInput.val(parseInt($currentInput.val()) - direction); // Revert input change
        return;
    }
    
    if (parseInt($currentInput.val()) < 0) {
        $currentInput.val(0);
         updatePointsCounter();
        return;
    }
    
     if (parseInt($currentInput.val()) > 20) {
        $currentInput.val(20);
         updatePointsCounter();
        return;
    }

    $("#currentValue").html(updatedValue);
    
    disableButtons();
}

function makeStats(item, container, value = 0) {
    var label = $("<div/>", {
        "html": item
    });
    var picker = $("<input/>", {
        "id": item,
        "type": "number",
        "value": value,
        "min": 0,
        "max": 20
    });
    var div = $("<div/>", {});
    container.append(div.append([label, picker]));
}

function submitStats() {
    console.log("submitStats: Fired");
    var niceNumber = $(".nice-number input");
    var stats = {}
    niceNumber.each((index, item) => {
        var statType = $(item).attr("id");
        var statValue = $(item).val();
        stats[statType] = parseInt(statValue)
    })
    console.log("submitStats: Collected stats:", stats);
    var currentValue = parseInt($("#currentValue").text(), 10);
    if (currentValue != 0) {
        dialog(`You still have points to assign`)
    } else {
        toggleHide()
        makeRoleStats(stats)
    }
}

function disableButtons() {
     var currentValue = parseInt($("#currentValue").text(), 10);
     
    $('.nice-number').each(function () {
        var value = parseInt($($(this).children()[1]).val());
        var minus = $($(this).children()[0]);
        var plus = $($(this).children()[2]); // Assuming plus is the third child
        
        minus.prop("disabled", value <= 0);
        plus.prop("disabled", currentValue <= 0);
    })
}

function updatePointsCounter() {
    // Calculate total points used
    var totalUsed = 0;
    $('#stats input[type="number"]').each(function() {
        var value = parseInt($(this).val()) || 0;
        // Clamp value between 0 and 20 individually if needed, but the main constraint is total
        if (value < 0) {
             $(this).val(0);
             value = 0;
        }
        totalUsed += value;
    });

    // If total used exceeds 20, we need to handle it. 
    // For now, let's just update the display and let disableButtons/submitStats handle the valid state
    
    var pointsRemaining = 20 - totalUsed;
    $("#currentValue").html(pointsRemaining);
    
    disableButtons();
}

function dialog(text) {
    var dc = $("#dialog-confirm")
    dc.html(text);
    dc.dialog({
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            Cancel: function () {
                $(this).dialog("close");
            }
        }
    });
}

function toggleHide() {
    $('.show').addClass('temp')
    $('.show').removeClass('show')
    $('.hide').addClass('show')
    $('.hide').removeClass('hide')
    $('.temp').addClass('hide')
}

jsLoaded = true