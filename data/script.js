var idHash = {"VALVE":"valveButton",
              "RESIDENCE": "residence",
              "MILLIS":"uptimeValue",
              "SSID":"ssidVal",
              "IP":"ipAddr",
              "FREQ":"flowLitersVal",
              "RATE":"flowRateVal"
         }
var TOTAL_WATER;
var LIMIT;
var RATE_LOG = {};
$(document).ready(()=>{
    LIMIT = parseInt($("#limitPlaceholder").val())
    $("#overview").click((e)=>{
                            if(!(e.target.id=="flowChart"||e.target.id=="downloadJson")){
                                $("#bg").toggleClass("transition");
                                $("#overview").toggleClass("view");
                                $("#innerContainer").fadeToggle();
                            }
                            });
    $("#misc").click(    (e)=>{
                        if(!(e.target.id=="innerContainer2")){
                                $("#bg").toggleClass("transition");
                                $("#overview").removeClass("view");
                                $("#innerContainer").fadeOut();
                                $("#misc").toggleClass("view") ; 
                                $("#innerContainer2").fadeToggle();
                            }
                            });
    $("#settings").click(()=>{
                            $("#bg").toggleClass("transition");
                            $("#settingContainer").slideToggle();
                            $('#settings').toggleClass("reverse")
                            
    });
    $("#refreshButton").click(()=>{
        $("#refreshButton").addClass("active");
        $("#refreshButton").one("webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend",
            ()=>{
                window.location.reload();
            });
    });
    $("#restartButton").click(()=>{
        $("#restartButton").addClass("active");
        $("#restartButton").one("webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend",
            ()=>{
                $.get('/restartBoard', {"restart":1}, (response)=>{console.log("restarted board")});
            });
    });
    $('#limitInput').focusin(()=>{
        $('#limitContainer div').addClass("inputActive")
    })
    $('#limitInput').focusout(()=>{
        $('#limitContainer div').removeClass("inputActive")
    })
    $('#limitInput').change(()=>{
        $("#confirmModal").fadeIn('slow')
        $("#confirmModal .container div button#yes").click(()=>{
            $("#confirmModal").fadeOut('slow');
            LIMIT = $('#limitInput').val();
            $('#limitMiscVal').html(LIMIT)
            $.get('/setLimit',{"LIM":LIMIT}, (response)=>{alert("Successfully updated Limit")});
        });
        $("#confirmModal .container div button#no").click(()=>{
            $("#confirmModal").fadeOut('slow');
            $('#limitInput').val(LIMIT);
        });
    })
    $("#limitToggle input").change(()=>{
        if($("#limitToggle input").prop('checked')){
            $("#limitContainer").removeClass("limitInactive");
            $('#limitContainer div').children().attr('disabled',false);
            $('#limitContainer button').attr('disabled',false);
            $.get('/setLimStat', {"LIMSTAT": 1 }, (response)=>{console.log("enabled Limit")});
        }
        else{
            $("#limitContainer").addClass("limitInactive");
            $('#limitContainer div').children().attr('disabled',true);
            $.get('/setLimStat', {"LIMSTAT": 0 }, (response)=>{console.log("disabled Limit")});
        }
    });
    
    $("#valveButton").click(()=>{
        if($("#valveButton").html()=="ON") $.ajax({
                                    url: "/valveOff",
                                    success: (result)=>{
                                        $("#valveButton").html(result)
                                    }
                                })
        else if($("#valveButton").html()=="OFF") $.ajax({
                                    url: "/valveOn",
                                    success: (result)=>{
                                        $("#valveButton").html(result)
                                    }
                                })
    });
    $("body").on('DOMSubtreeModified', "#flowLitersVal", ()=>{
        let ESTIMATED_COST = parseFloat($("#flowLitersVal").html())*$("#costInput").val()
        $("#estimatedCostVal").html(ESTIMATED_COST)
    });
    $('#costInput').change(()=>{
        $("#rateVal").html($("#costInput").val())
    })
    $("#downloadJson").click(()=>{
        $("#downloadJson").addClass("active")
        var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(RATE_LOG));
        $("#downloadJson").prop("href", "data:"+data);
        $("#downloadJson").prop("download", "log.json");
        alert("Starting Download...");
    })
    setInterval(()=>{
        console.log("AJAX SENDING");
            $.ajax({
                url: "/updateOutput",
                success: (result)=>{
                        console.log(result);
                        let jsonObj = JSON.parse(result)
                        if($("#conStatus").html()!="/"){
                            $("#check").fadeIn();
                            $("#crossmark").hide();
                            $(".con").css("border-color","green")
                            $(".con").css("color","green")
                        }
                        for(i in jsonObj){
                            if (i=="MILLIS"){
                                let parsedTime = parseTime(jsonObj[i]);
                                for( x in parsedTime){
                                    if(parsedTime[x]!=0){
                                        if(parsedTime[x]>1) $("#uptimeUnit").html(x+"s");
                                        else $("#uptimeUnit").html(x);
                                        $("#uptimeValue").html(parsedTime[x]);
                                        break;
                                    }
                                }
                            }
                            else{
                                if (i == "VALVE"){
                                    if(jsonObj[i] =="ON"){
                                        $("#valveButton").css("border-color","#0d98ba")
                                        $("#valveButton").css("color","#0d98ba")
                                    }
                                    else if(jsonObj[i] == "OFF"){
                                        $("#valveButton").css("border-color","gray")
                                        $("#valveButton").css("color","gray")
                                    }
                                }
                                else if (i=="FREQ") TOTAL_WATER = jsonObj[i];
                                if (i=="RATE"){
                                    let dt = new Date()
                                    var time = dt.getHours() + ":" + dt.getMinutes()
                                    if (!(time in RATE_LOG)){
                                        RATE_LOG[time] = jsonObj[i];
                                        updateChart(frChart,time,jsonObj[i])
                                    }
                                }   
                                $("#"+idHash[i]).html(jsonObj[i]);
                            }
                        }
                    },
                error: ()=>{
                    console.log("ERROR")
                    $("#crossmark").fadeIn();
                    $("#check").hide();
                    $(".con").css("border-color","red")
                    $(".con").css("color","red")
                },
                timeout: 3000,
                type: "GET",
                async: true,
            });
    },5000);
});
function parseTime( milliseconds ){
    //SNIPPET:https://gist.github.com/Erichain/6d2c2bf16fe01edfcffa
    var day, hour, minute, seconds;
    seconds = Math.floor(milliseconds / 1000);
    minute = Math.floor(seconds / 60);
    seconds = seconds % 60;
    hour = Math.floor(minute / 60);
    minute = minute % 60;
    day = Math.floor(hour / 24);
    hour = hour % 24;
    return {
        day: day,
        hour: hour,
        minute: minute,
        second: seconds
    };
}