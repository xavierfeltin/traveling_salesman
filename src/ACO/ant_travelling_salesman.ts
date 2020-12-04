import { Graph, Link, Node } from "../graph";

export class Ant {
    private path: string[];
    private alpha: number;
    private beta: number;
    private gamma: number;

    constructor(alpha: number, beta: number, gamma: number) {
        this.path = [];
        this.alpha = alpha;
        this.beta = beta;
        this.gamma = gamma;
    }

    public randomWalk(map: Graph): string[] {
        const cities = map.getNodes();
        let remainingCities = [...cities];
        const indexStartingPoint = Math.floor(Math.random() * cities.length);
        let startingPoint = cities[indexStartingPoint].label;
        let origin = cities[indexStartingPoint];

        this.path.push(startingPoint);

        // remove the city from cities still to visit
        remainingCities = remainingCities.filter((n: Node) => {
            return n.label !== startingPoint;
        })

        while (remainingCities.length > 0) {
            let nextCity = this.pickNextCity(startingPoint, remainingCities.map((n: Node) => {return n.label}), map);

            this.path.push(nextCity);

            // remove the city from cities still to visit
            remainingCities = remainingCities.filter((n: Node) => {
                return n.label !== nextCity;
            });
            startingPoint = nextCity;
        }

        this.path.push(origin.label); // And... back to base

        return this.path;
    }

    public getPath(): string[] {
        return this.path;
    }

    private pickNextCity(currentCity: string, availableCities: string[], map: Graph): string {

        let probabilities: number [] = [];
        let sumProbabilities = 0.0;

        if (availableCities.length == 1) {
            return availableCities[0];
        }

        for(let city of availableCities)
        {
            // Compute transitional probability
            const p = this.computeTransitionalProbability(currentCity, city, map);
            probabilities.push(p);
            sumProbabilities += p;
        }

        // Average the probabilities
        probabilities = probabilities.map((value: number) => {
            return value / sumProbabilities;
        });

        // console.log("Going from " + currentCity + ": ");
        //for (let i = 0; i < availableCities.length; i++) {
        //    let link  = map.getLink(currentCity, availableCities[i]);
            // let pheromones = link?.pheromones;
            // console.log("  - To : " + availableCities[i] + "(" + (probabilities[i] * 100.0).toFixed(4) + "%) (" + pheromones + ")");
        //}

        // Randomly select the next city
        const randomSelection = Math.random();
        let cumulatedProba = 0.0;
        let i = 0;
        while (cumulatedProba <= randomSelection && i < probabilities.length) {
            cumulatedProba += probabilities[i];

            if (cumulatedProba <= randomSelection) {
                i++;
            }
        }
        i = Math.min(i, probabilities.length - 1); //round proba to 1

        // console.log("Choose to go to : " + availableCities[i] + " (" + (randomSelection * 100.0).toFixed(4) + "%)");
        return availableCities[i];
    }

    private computeTransitionalProbability(currentCity: string, nextCity: string, map: Graph): number {
        let nodeCurrentCity = map.getNode(currentCity);
        let p = 0.0;

        if (nodeCurrentCity) {
           let linkNextCity = nodeCurrentCity.links[nextCity];

            if (linkNextCity) {
                const pheromonesOnRoad = linkNextCity.pheromones;
                const visibility = 1.0 / linkNextCity.weight;
                p = this.gamma + Math.pow(pheromonesOnRoad, this.alpha) * Math.pow(visibility, this.beta);
            }
        }

        return p;
    }
}