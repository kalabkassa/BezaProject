// chart.js
document.addEventListener('DOMContentLoaded', function() {
    var ctx = document.getElementById('vitalSignsChart').getContext('2d');

    var chartData = JSON.parse('');

    var chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.timestamps,
            datasets: [
                {
                    label: 'Heart Rate',
                    data: chartData.heart_rates,
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1,
                    fill: false
                },
                {
                    label: 'Temperature',
                    data: chartData.temperatures,
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Timestamp'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            }
        }
    });

    function updateChart() {
        // Fetch the updated data from the server
        fetch("{% url 'vital' %}")
            .then(response => response.json())
            .then(updatedData => {
                // Update the chart's data and labels
                chart.data.labels = updatedData.timestamps;
                chart.data.datasets[0].data = updatedData.heart_rates;
                chart.data.datasets[1].data = updatedData.temperatures;

                // Redraw the chart
                chart.update();
            });

        // Schedule the next update
        setTimeout(updateChart, 5000);  // Update every 5 seconds
    }

    // Start updating the chart
    updateChart();
});
