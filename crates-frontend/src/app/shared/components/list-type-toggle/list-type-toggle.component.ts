import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ListType } from '../../model/list-type.model';

@Component({
  selector: 'crates-list-type-toggle',
  templateUrl: './list-type-toggle.component.html',
  styleUrls: ['./list-type-toggle.component.scss']
})
export class ListTypeToggleComponent {
  ListType = ListType;
  @Input() listType: ListType;
  @Output() toggle = new EventEmitter<ListType>();

  constructor() {
  }

  toggleListType(listType: ListType): void {
    this.toggle.emit(listType);
  }
}
