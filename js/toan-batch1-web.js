// Pilot integration only. The math core and its IDs stay independent of App/Storage.
(function () {
  const W = {
    active(data) {
      return !!(window.API && API.pilotOn() && data && data._batch1Pilot &&
        window.ToanBatch1Adapter && ToanBatch1Adapter.ID_LISTS);
    },
    decorate(q) { return Object.assign({}, q, { stage: 2, generated: true, batch1Pilot: true }); },
    attachData(data, gradeId) {
      if (gradeId !== 'lop3' || !this.active(data)) return;
      const s = data.subjects.find(s => s.id === 'toan');
      if (!s) return;
      ToanBatch1Adapter.ID_LISTS.topics.forEach(meta => {
        const t = s.topics.find(t => t.id === meta.topicId);
        if (!t) return;
        Object.assign(t, { manualOnly: true, generated: true, batch1Pilot: true, icon: '🧪',
          name: meta.title + ' (thử)', title: meta.title + ' (thử)' });
        t.questions = t.questions.map(q => this.decorate(q));
        // Resolve against the normalized data actually used by App, never the raw API copy.
        Storage.registerIdTopic(t.id, () => t.questions);
      });
    },
    normalize(q) {
      if (window.LearningEngine && LearningEngine.normalizeQuestionBank) {
        const meta = ToanBatch1Adapter.ID_LISTS.topics.find(t => t.unit === q.unit);
        const d = LearningEngine.normalizeQuestionBank({ subjects: [{ id: 'toan', topics: [
          { id: meta.topicId, questions: [q] }
        ] }] });
        q = d.subjects[0].topics[0].questions[0];
      }
      return this.decorate(q);
    },
    restore(data) {
      const none = { added: 0, present: 0, unresolvedIds: [], topics: [] };
      if (!this.active(data)) {
        // History stays intact when viewing another grade or when the pilot bank failed to load.
        // Do not let an empty current-grade pool be mistaken for "all wrong answers fixed".
        if (window.API && API.pilotOn() && window.ToanBatch1Adapter) {
          none.unresolvedIds = ToanBatch1Adapter.idsFromHistory(Storage.getWrongHistory(), Storage.getReviewMap());
        }
        return none;
      }
      const result = ToanBatch1Adapter.ensureFromHistory(data.subjects,
        Storage.getWrongHistory(), Storage.getReviewMap(), { normalize: q => this.normalize(q) });
      if (result.added && window.Today) Today._qIdxCache = null;
      return result;
    }
  };
  window.ToanBatch1Web = W;
})();
