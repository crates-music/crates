import { Component } from '@angular/core';

@Component({
  selector: 'app-following-list-wrapper',
  template: `
    <app-user-list
      listType="following"
      title="FOLLOWING"
      emptyStateIcon="bi-person-check"
      emptyStateTitle="Not following anyone yet"
      emptyStateMessage="When you follow people, they'll appear here.">
    </app-user-list>
  `
})
export class FollowingListWrapperComponent {
}