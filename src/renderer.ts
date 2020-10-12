import { ACO, PheromoneCoverage } from "./ACO/ant_colony_optimizer";

export class Renderer {
    public static render(ctx: CanvasRenderingContext2D, optim: ACO, isPathRendering: boolean, isPheromoneRendering: boolean) {
        Renderer.renderBackgroundArea(ctx);
        Renderer.renderCities(ctx);

        if (isPathRendering) {
            Renderer.renderPath(ctx, optim.getMostMarkedSolution().path);
        }

        if (isPheromoneRendering) {
            Renderer.renderPheromones(ctx, optim.getPheromonesCoverage());
        }
    }

    private static renderBackgroundArea(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, 800, 800);
        ctx.save(); // save current state
        ctx.canvas.height = 800;
        ctx.canvas.width = 800;
        ctx.strokeRect(0, 0, 800, 800);
        ctx.restore(); // restore original states (no rotation etc)
    }

    private static renderCities(ctx: CanvasRenderingContext2D ) {
        let positions = Renderer.getLocalizationData();

        let keys = Object.keys(positions);
        let radius = 10;

        ctx.save();
        ctx.font = "20px Arial";
        const marginLabel = 15;
        for (let key of keys) {
            const x = positions[key].x;
            const y = positions[key].y;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.stroke();

            if (key === "Lyon") {
                ctx.fill();
            }

            ctx.fillText(key, x - radius / 2.0 - marginLabel, y - radius / 2.0 - marginLabel);
        }
        ctx.restore();
    }

    private static renderPath(ctx: CanvasRenderingContext2D, path: string[]) {
        const localzations = Renderer.getLocalizationData();
        ctx.save();

        ctx.beginPath();
        for (let i = 0; i < path.length - 1; i++) {
            const origin = path[i];
            const destination = path[i+1];

            const coordO = localzations[origin];
            const coordD = localzations[destination];

            Renderer.drawArrow(ctx, coordO.x, coordO.y, coordD.x, coordD.y);
        }
        ctx.stroke();

        ctx.restore();
    }

    private static drawArrow (ctx: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number): void {
        const headlen = 10; // length of head in pixels
        const dx = tox - fromx;
        const dy = toy - fromy;
        const angle = Math.atan2(dy, dx);

        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    }

    private static renderPheromones(ctx: CanvasRenderingContext2D, coverage: PheromoneCoverage[]) {
        const localzations = Renderer.getLocalizationData();

        let maxValue = 0;
        for (let c of coverage) {
            if (c.pheromones > maxValue) {
                maxValue = c.pheromones;
            }
        }

        let weakTrail = maxValue * 0.3;
        let trail = maxValue * 0.6;
        let strongTrail = maxValue * 0.9;

        ctx.save();
        for (let c of coverage) {

            if (c.pheromones < 0.0001) {
                continue;
            }

            const coordO = localzations[c.origin];
            const coordD = localzations[c.destination];

            if (c.pheromones <= weakTrail) {
                //ctx.lineWidth = 1;
                ctx.strokeStyle = "#B0E0E6";
            }
            else if (c.pheromones <= trail) {
                //ctx.lineWidth = 2;
                ctx.strokeStyle = "#7CFC00";
            }
            else if (c.pheromones <= strongTrail) {
                //ctx.lineWidth = 3;
                ctx.strokeStyle = "#FF7F50";
            }
            else {
                //ctx.lineWidth = 4;
                ctx.strokeStyle = "#FF0000";
            }

            ctx.beginPath();
            ctx.moveTo(coordO.x, coordO.y);
            ctx.lineTo(coordD.x, coordD.y);
            ctx.stroke();

            ctx.fillText(c.pheromones.toFixed(4), (coordO.x + coordD.x) / 2.0, (coordO.y + coordD.y) / 2.0);
        }

        ctx.restore();
    }

    private static getLocalizationData(): any {
        let positions: any = {};

        positions["Lyon"] = {
            x: 300,
            y: 450
        };

        positions["Bourgoin-Jallieu"] = {
            x: 450,
            y: 500
        };

        positions["Saint-Etienne"] = {
            x: 100,
            y: 550
        };

        positions["Villefranche"] = {
            x: 200,
            y: 300
        };

        positions["Mâcon"] = {
            x: 320,
            y: 150
        };

        positions["Valence"] = {
            x: 300,
            y: 700
        };

        return positions;
    }
}