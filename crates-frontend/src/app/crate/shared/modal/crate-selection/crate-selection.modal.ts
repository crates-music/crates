import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Component } from '@angular/core';
import { CrateService } from '../../crate.service';
import { Crate } from '../../model/crate.model';
import { tap, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Pageable } from '../../../../shared/model/pageable.model';
import { Page } from '../../../../shared/model/page.model';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';

@Component({
  selector: 'crate-crate-selection-modal',
  templateUrl: './crate-selection-modal.html',
  styleUrls: ['./crate-selection.modal.scss']
})
export class CrateSelectionModal {
  cratePage: Page<Crate>;
  allCrates: Crate[] = [];
  creating = false;
  crateName: string;
  searchControl = new FormControl('');
  loading = false;
  currentPage = 0;
  pageSize = 10;
  hasMore = true;
  initialLoadComplete = false;
  private searchSubject = new Subject<string>();

  constructor(private activeModal: NgbActiveModal,
              private crateService: CrateService) {
    this.setupSearch();
    this.loadCrates();
  }

  private setupSearch() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      // Store focus state before search
      const searchInput = document.querySelector('.search-input') as HTMLInputElement;
      const hadFocus = searchInput && document.activeElement === searchInput;
      
      this.searchSubject.next(searchTerm || '');
      
      // Restore focus after a short delay to let the DOM update
      if (hadFocus) {
        setTimeout(() => {
          const newSearchInput = document.querySelector('.search-input') as HTMLInputElement;
          if (newSearchInput) {
            newSearchInput.focus();
          }
        }, 50);
      }
    });

    this.searchSubject.pipe(
      switchMap(searchTerm => {
        this.currentPage = 0;
        this.allCrates = [];
        this.hasMore = true;
        return this.loadCratesPage(searchTerm);
      })
    ).subscribe();
  }

  private loadCrates() {
    this.loadCratesPage('').subscribe(() => {
      this.initialLoadComplete = true;
    });
  }

  private loadCratesPage(searchTerm: string = '') {
    this.loading = true;
    
    return this.crateService.getCrates(
      Pageable.of(this.currentPage, this.pageSize), 
      searchTerm || undefined
    ).pipe(
      tap(cratePage => {
        this.cratePage = cratePage;
        
        if (this.currentPage === 0) {
          this.allCrates = [...cratePage.content];
        } else {
          this.allCrates = [...this.allCrates, ...cratePage.content];
        }
        
        this.hasMore = !cratePage.last;
        this.loading = false;
        if (!this.initialLoadComplete) {
          this.initialLoadComplete = true;
        }
      })
    );
  }

  loadMoreCrates() {
    if (this.hasMore && !this.loading) {
      this.currentPage++;
      this.loadCratesPage(this.searchControl.value || '').subscribe();
    }
  }

  clearSearch() {
    this.searchControl.setValue('');
  }

  createCrate(name: string) {
    this.crateService.createCrate(name).pipe(
      tap(crate => {
        this.allCrates.unshift(crate);
        this.creating = false;
        this.crateName = '';
      })
    ).subscribe();
  }

  crateCrateClicked() {
    this.creating = true;
    setTimeout(() => {
      const input = document.getElementById('crateName') as HTMLInputElement;
      if (input) {
        // Try multiple approaches to trigger mobile keyboard
        input.focus();
        input.click();
        
        // For iOS Safari specifically
        const touchEvent = new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
        });
        input.dispatchEvent(touchEvent);
        
        // Set cursor position to end of input
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 200);
  }

  selectCrate(crate: Crate) {
    this.activeModal.close(crate);
  }
}
