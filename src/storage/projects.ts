import { Dexie, type Table } from 'dexie';
import { parseArchive, type ProjectArchive } from '../core/schema.js';
import { assertTransition } from '../core/workflow.js';
export class BrowserProjectRepository {
  db: Dexie;
  private archives: Table<ProjectArchive, string>;
  constructor(name = 'threadlatch-v1-' + (typeof location === 'object' ? location.pathname.split('/')[1] : 'local')) {
    this.db = new Dexie(name); this.db.version(1).stores({ archives: 'project.id' }); this.archives = this.db.table('archives');
  }
  async list() { return this.archives.toArray(); }
  async load(projectId: string) { return this.archives.get(projectId); }
  async create(archive: ProjectArchive) { await this.archives.add(parseArchive(JSON.stringify(archive))); }
  async save(archive: ProjectArchive, expectedRevisionId: string) {
    const valid = parseArchive(JSON.stringify(archive));
    await this.db.transaction('rw', this.archives, async () => {
      const current = await this.archives.get(valid.project.id);
      if (!current || current.project.currentRevisionId !== expectedRevisionId || current.project.generation !== valid.project.generation) throw new Error('Revision conflict. Reload current memory and review again.');
      assertTransition(current, valid);
      valid.project.generation++; await this.archives.put(valid);
    });
    archive.project.generation = valid.project.generation;
  }
  async remove(projectId: string) { await this.archives.delete(projectId); }
}
