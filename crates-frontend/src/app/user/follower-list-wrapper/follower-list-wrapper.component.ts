import { Component } from '@angular/core';

@Component({
  selector: 'app-follower-list-wrapper',
  template: `
    <app-user-list
      listType="followers"
      title="FOLLOWERS"
      emptyStateIcon="bi-person-plus"
      emptyStateTitle="No followers yet"
      emptyStateMessage="When people follow you, they'll appear here.">
    </app-user-list>
  `
})
export class FollowerListWrapperComponent {
}