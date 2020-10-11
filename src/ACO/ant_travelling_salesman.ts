import { Graph } from "../graph";

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
        let startingPoint = cities[indexStartingPoint];
        let origin = cities[indexStartingPoint];

        this.path.push(startingPoint);

        // remove the city from cities still to visit
        remainingCities = remainingCities.filter((val: string) => {
            return val !== startingPoint;
        })
        
        while (remainingCities.length > 0) {
            let nextCity = this.pickNextCity(startingPoint, remainingCities, map);

            this.path.push(nextCity);

            // remove the city from cities still to visit
            remainingCities = remainingCities.filter((val: string) => {
                return val !== nextCity;
            });            
            startingPoint = nextCity;
        }

        this.path.push(origin); // And... back to base

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

        console.log("Going from " + currentCity + ": ");
        for (let i = 0; i < availableCities.length; i++) {
            console.log("  - To : " + availableCities[i] + "(" + (probabilities[i] * 100.0).toFixed(4) + "%) (" + map.getLink(currentCity, availableCities[i]).pheromones + ")");
        }

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

        console.log("Choose to go to : " + availableCities[i] + " (" + (randomSelection * 100.0).toFixed(4) + "%)");
        return availableCities[i];
    }

    private computeTransitionalProbability(currentCity: string, nextCity: string, map: Graph): number {
        let nodeCurrentCity = map.getNode(currentCity);
        
        if (nodeCurrentCity) {
            const pheromonesOnRoad = nodeCurrentCity.links[nextCity].pheromones;
            const visibility = 1.0 / nodeCurrentCity.links[nextCity].weight;
            const p = this.gamma + Math.pow(pheromonesOnRoad, this.alpha) * Math.pow(visibility, this.beta);
            return p;
        } else {
            return 0.0;
        }        
    }
}