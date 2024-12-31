import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { debounceTime, fromEvent, map, Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'crates-searchbar',
  templateUrl: './searchbar.component.html',
  styleUrls: ['./searchbar.component.scss']
})
export class SearchbarComponent implements OnInit, OnDestroy {
  @Input()
  placeholder: string;
  @Output()
  search = new EventEmitter<string>();
  @ViewChild('searchInput', { static: true }) searchInput: ElementRef;
  destroy$ = new Subject<boolean>();
  searchTerm: string;

  ngOnInit(): void {
    fromEvent(this.searchInput.nativeElement, 'keyup').pipe(
      debounceTime(300), // Set the debounce time in milliseconds
      map((event: any) => event.target.value), // Map the event to the input value
      tap(value => this.search.emit(value)),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  clearSearch() {
    this.searchTerm = '';
    this.search.emit(undefined);
  }
}
