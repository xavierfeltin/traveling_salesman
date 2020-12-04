import { ACO } from "./ACO/ant_colony_optimizer";
import { Chart } from "chart.js";
import { ACOMinMax } from "./ACO/ant_colony_optimizer_minmax";

export class ChartOptimRenderer {
    //public static initialize(ctx: CanvasRenderingContext2D, optim: ACO): Chart {
        public static initialize(ctx: CanvasRenderingContext2D, optim: ACOMinMax): Chart {
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
                label: 'Travel length (m)',
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
    //public static render(chart: Chart, optim: ACO): void {
    public static render(chart: Chart, values: number[]): void {
        let scores: number[] = [];
        let iterations: number[] = [];

        for (let i = 0; i < values.length; i++)
        {
            scores.push(values[i]);
            iterations.push(i+1);
        }

        if (chart.data.datasets) {
            chart.data.datasets[0].data = scores;
        }
        chart.data.labels = iterations;

        chart.update();
    }
}