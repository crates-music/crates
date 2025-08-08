import LogRocket from 'logrocket';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

// Initialize LogRocket before Angular bootstrap
LogRocket.init('a2manf/crates');

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
