import { Graph } from '../graph';
import { ACOMeta, ACOParameters } from './ant_colony';

export class ACO extends ACOMeta {

    constructor(params: ACOParameters, toOptimize: Graph) {
        super(params, toOptimize);
    }
}