import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generated class for the SearchPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'search',
})
export class SearchPipe implements PipeTransform {

  transform(items: any[], field: string, terms: string, gender: string): any[] {
    if (!items) return [];
    if (!terms && !gender) return items;
    terms = terms.toLowerCase();
    console.log('GENDER', gender);
    return items.filter(it => {
      return it[field].toLowerCase().includes(terms) && it.gender.toLowerCase() === gender;
    });
  }
}
