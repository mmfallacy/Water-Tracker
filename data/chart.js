
var flowCanvas = $("#flowChart");

Chart.defaults.global.defaultFontFamily = "Lato";
Chart.defaults.global.defaultFontSize = 12;

var chartOptions = {
    responsive: true,
    legend:{display:false},
    elements:{
        line:{
            tension:0
        }
    },
    tooltips:{
        displayColors:false,
        xPadding:15,
        yPadding:10,
    },
    scales: {
        xAxes: [{
            display: true,
            scaleLabel: {
                display:true,
                labelString: "Flow Rate (L/min)",
                fontColor:"white"
            },gridLines: {
                display: false,
            },
            ticks: {
                fontColor: "white",
                display:false
                }
        }],
        yAxes: [{
            display: true,
            gridLines: {
                display: false,
            },
            ticks: {
                fontColor: "white",
                suggestedMin: 3
                }
        }]
    }
};

var data = {
    labels: [0],
    datasets: [
        {
            label: "Flow Rate (L/min)",
            backgroundColor: ["rgba(255, 255, 255, .3)"],
            pointBorderColor: "white",
            borderColor:"rgba(255, 255, 255, .4)",
            pointHoverRadius: 1,
            pointHitRadius: 1,
            data: [0]
        }
    ]
};

var frChart= new  Chart(flowCanvas,{
        type:"line",
        data:data,
        options:chartOptions
    });

function updateChart(chart,time,data){
    label = time;
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(data);
    if(chart.data.labels.length>8){
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    chart.update();
}


