import { Graph, Node } from "./graph";
import { Chart } from "chart.js";

export class MapRenderer {
    public static initialize(ctx: CanvasRenderingContext2D, graph: Graph): Chart {
        let cities: {x: number, y: number}[] = [];
        let labels: string[] = [];

        let nodes = graph.getNodes();
        for (let n of nodes) {
            let coord = {x: n.x, y: n.y}
            cities.push(coord);
            labels.push(n.label);
        }

        let data =  {
            labels: labels,
            datasets: [{
                borderColor: "#dc143c",
                label: 'Interest points (m)',
                data: cities,
                fill: false
            },
            {
                type: "line",
                label: "Best path",
                data: [],
                fill: false,
                borderColor: "#bae755",
                borderDash: [10,5],
                borderWidth: 2
            }]
        };

        let options = {
            animation: {
                duration: 0 // general animation time
            },
            elements: {
                line: {
                    tension: 0 // disables bezier curves
                }
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        };

        let myChart = new Chart(ctx, {
            type: 'scatter',
            data: data,
            options: options
        });

        return myChart
    }
    public static render(chart: Chart, graph: Graph, pathToDraw: string[]): void {
        let cities: {x: number, y: number}[] = [];
        let labels: string[] = [];

        let nodes = graph.getNodes();
        for (let n of nodes) {
            let coord = {x: n.x, y: n.y}
            cities.push(coord);
            labels.push(n.label);
        }

        chart.data.labels = labels;
        if (chart.data.datasets) {
            chart.data.datasets[0].data = cities;
        }

        // Draw path
        let dataLines: {x: number, y: number}[]  = [];
        for (let p of pathToDraw) {
            let n = nodes.find((n: Node) => {
                return n.label === p;
            })

            if (n) {
                dataLines.push({
                    x: n.x,
                    y: n.y
                });
            }
        }
        if (chart.data.datasets) {
            chart.data.datasets[1].data = dataLines;
        }

        chart.update();
    }
}