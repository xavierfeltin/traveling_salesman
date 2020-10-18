import { ACO, ACOParameters } from "../ACO/ant_colony_optimizer";

export interface GenParameters {
    maxIterations: number;
    populationSize: number;
    crossoverRate: number;
    mutationRate: number;
};

export class Genetic {
    private parameters: GenParameters;
    private population: ACOParameters[];

    constructor(params: GenParameters) {
        this.parameters = params;
        this.population = [];
    }

    public optimize(): ACOParameters {
        let bestSolution: ACOParameters;

        for (let i = 0; i < this.parameters.maxIterations; i++) {
            this.evolve();
        }
        return bestSolution;
    }

    private evolve() {
        this.evaluate();
        this.selectParents();
        this.crossOver();
        this.mutate();
        this.generateNewGeneration();
    }

    private selectParents() {

    }

    private mutate() {

    }

    private crossOver() {

    }

    private generateNewGeneration() {

    }

    private evaluate() {

    }
}