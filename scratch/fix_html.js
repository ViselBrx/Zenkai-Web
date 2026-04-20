const fs = require('fs');
const filepath = 'c:/Users/enzot/Desktop/Videos-redecanais/perfil.html';
let html = fs.readFileSync(filepath, 'utf8');

// Replace the invalid div closure with the main closure
const oldLines = `      </section>
    </section>
  </div>
</div>`;
const newLines = `      </section>
    </section>
  </div>
</main>`;

html = html.replace(oldLines, newLines);

fs.writeFileSync(filepath, html, 'utf8');
console.log('✅ HTML markup issues fixed.');
