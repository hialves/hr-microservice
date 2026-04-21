import { balanceErrors } from '../hcm/modules/balance/errors.map';
import { requestErrors } from '../timeoff/modules/request/errors.map';

const errors = [requestErrors, balanceErrors];

export const errorMapping: Map<Function, number> = new Map();

for (const map of errors) {
  for (const [key, value] of map.entries()) {
    errorMapping.set(key, value);
  }
}
