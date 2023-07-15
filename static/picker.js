function statPickerInit() {
    var statNames = ["Strength", "Wisdom", "Loyalty"]
    var userId = SugarCube.State.getVar("$userId");
    var user = SugarCube.State.getVar("$users")[userId];

    let stats = SugarCube.State.variables.users[userId]["stats"];
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
            onIncrement: ($currentInput, amount, settings) => changeHelper($currentInput, amount, settings, 1),
            onDecrement: ($currentInput, amount, settings) => changeHelper($currentInput, amount, settings, -1),
        });

        disableButtons();
        
    }, 0);
    return ""
}

function changeHelper($currentInput, amount, settings, direction) {
    if (amount < 0) {
        $currentInput.val($currentInput.val() - direction);
        return
    }

    var currentValue = parseInt($("#currentValue").text(), 10);
    var updatedValue = currentValue - direction;
    if (updatedValue < 0 || updatedValue > 20) {
        $currentInput.val($currentInput.val() - direction);
        return
    }

    $("#currentValue").html(updatedValue);

    var element = document.getElementById($currentInput[0].id);
    var parentElement = element.parentNode;
    var minus = parentElement.firstElementChild;
    if (amount > 0) {
        minus.disabled = false;
    } else {
        minus.disabled = true;
    }
}

function makeStats(item, container, value = 0) {
    var label = $("<div/>", {
        "html": item
    });
    var picker = $("<input/>", {
        "id": item,
        "type": "number",
        "value": value,
        "disabled": true
    });
    var div = $("<div/>", {});
    container.append(div.append([label, picker]));
    $('.statsInput').on("focus", function() {
        console.log($(this))
        $(this).blur()
    })
}

function submitStats() {
    var niceNumber = $(".nice-number input");
    var stats = {}
    niceNumber.each((index, item) => {
        var statType = $(item).attr("id");
        var statValue = $(item).val();
        stats[statType] = parseInt(statValue)
    })
    var currentValue = parseInt($("#currentValue").text(), 10);
    if (currentValue != 0) {
        dialog(`You still have points to assign`)
    } else {
        toggleHide()
        makeRoleStats(stats)
    }
}

function disableButtons() {
    $('.nice-number').each(function () {
        var value = $($(this).children()[1]).val()
        var minus = $($(this).children()[0]);
        minus.prop("disabled", true);
    })
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