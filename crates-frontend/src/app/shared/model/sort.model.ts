export class Sort {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;

  static empty(): Sort {
    return {
      sorted: false,
      unsorted: true,
      empty: true
    }
  }
}
