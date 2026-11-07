import {finite} from './core.js';

export function windCoverage(rows) {
  const speed=rows.filter(r=>finite(r.wind)).length;
  const gust=rows.filter(r=>finite(r.gust)).length;
  const direction=rows.filter(r=>finite(r.windDirection)).length;
  return {total:rows.length,speed,gust,direction,status:!speed?'missing':speed===rows.length&&gust===rows.length&&direction===rows.length?'complete':'partial'};
}
