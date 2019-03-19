import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generated class for the SearchPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'search',
  pure: false
})
export class SearchPipe implements PipeTransform {
  transform(items: any[], field: string, terms: string, gender: string): any[] {
    if (!items) return [];
    if (!terms && (!gender || typeof gender == 'undefined')) return items;
    terms = terms.toLowerCase();
    return items.filter(it => {
      return it[field].toLowerCase().includes(terms) && (typeof it.gender != 'undefined' && it.gender.toLowerCase() === gender);
    });
  }
}
