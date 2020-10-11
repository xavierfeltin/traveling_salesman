import { ACO } from "./ACO/ant_colony_optimizer";
import { Chart } from "chart.js";

export class ChartOptimRenderer {
    public static initialize(ctx: CanvasRenderingContext2D, optim: ACO): Chart {
        let pheromones: number[] = [];
        let iterations: number[] = [];

        let paths = optim.getBestSolutions();
        for (let i = 0; i < paths.length; i++)
        {
            pheromones.push(paths[i].score);
            iterations.push(i+1);
        }

        let data =  {
            labels: iterations,
            datasets: [{
                label: 'Travel length (km)',
                borderColor: "#bae755",
                data: pheromones,
                fill: false
            }]
        };

        let options = {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        };

        let myChart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: options
        });

        return myChart
    }
    public static render(chart: Chart, optim: ACO): void {
        let pheromones: number[] = [];
        let iterations: number[] = [];

        const paths = optim.getBestSolutions();
        for (let i = 0; i < paths.length; i++)
        {
            pheromones.push(paths[i].score);
            iterations.push(i+1);
        }

        if (chart.data.datasets) {
            chart.data.datasets[0].data = pheromones;
        }
        chart.data.labels = iterations;

        chart.update();
    }
}