// /home/ray/Code/diagramatics-site/node_modules/@codemirror/state/dist/index.js
var textLength = function(text) {
  let length = -1;
  for (let line of text)
    length += line.length + 1;
  return length;
};
var appendText = function(text, target, from = 0, to = 1e9) {
  for (let pos = 0, i = 0, first = true;i < text.length && pos <= to; i++) {
    let line = text[i], end = pos + line.length;
    if (end >= from) {
      if (end > to)
        line = line.slice(0, to - pos);
      if (pos < from)
        line = line.slice(from - pos);
      if (first) {
        target[target.length - 1] += line;
        first = false;
      } else
        target.push(line);
    }
    pos = end + 1;
  }
  return target;
};
var sliceText = function(text, from, to) {
  return appendText(text, [""], from, to);
};
var isExtendingChar = function(code) {
  for (let i = 1;i < extend.length; i += 2)
    if (extend[i] > code)
      return extend[i - 1] <= code;
  return false;
};
var isRegionalIndicator = function(code) {
  return code >= 127462 && code <= 127487;
};
var findClusterBreak = function(str, pos, forward = true, includeExtending = true) {
  return (forward ? nextClusterBreak : prevClusterBreak)(str, pos, includeExtending);
};
var nextClusterBreak = function(str, pos, includeExtending) {
  if (pos == str.length)
    return pos;
  if (pos && surrogateLow(str.charCodeAt(pos)) && surrogateHigh(str.charCodeAt(pos - 1)))
    pos--;
  let prev = codePointAt(str, pos);
  pos += codePointSize(prev);
  while (pos < str.length) {
    let next = codePointAt(str, pos);
    if (prev == ZWJ || next == ZWJ || includeExtending && isExtendingChar(next)) {
      pos += codePointSize(next);
      prev = next;
    } else if (isRegionalIndicator(next)) {
      let countBefore = 0, i = pos - 2;
      while (i >= 0 && isRegionalIndicator(codePointAt(str, i))) {
        countBefore++;
        i -= 2;
      }
      if (countBefore % 2 == 0)
        break;
      else
        pos += 2;
    } else {
      break;
    }
  }
  return pos;
};
var prevClusterBreak = function(str, pos, includeExtending) {
  while (pos > 0) {
    let found = nextClusterBreak(str, pos - 2, includeExtending);
    if (found < pos)
      return found;
    pos--;
  }
  return 0;
};
var surrogateLow = function(ch) {
  return ch >= 56320 && ch < 57344;
};
var surrogateHigh = function(ch) {
  return ch >= 55296 && ch < 56320;
};
var codePointAt = function(str, pos) {
  let code0 = str.charCodeAt(pos);
  if (!surrogateHigh(code0) || pos + 1 == str.length)
    return code0;
  let code1 = str.charCodeAt(pos + 1);
  if (!surrogateLow(code1))
    return code0;
  return (code0 - 55296 << 10) + (code1 - 56320) + 65536;
};
var fromCodePoint = function(code) {
  if (code <= 65535)
    return String.fromCharCode(code);
  code -= 65536;
  return String.fromCharCode((code >> 10) + 55296, (code & 1023) + 56320);
};
var codePointSize = function(code) {
  return code < 65536 ? 1 : 2;
};
var addSection = function(sections, len, ins, forceJoin = false) {
  if (len == 0 && ins <= 0)
    return;
  let last = sections.length - 2;
  if (last >= 0 && ins <= 0 && ins == sections[last + 1])
    sections[last] += len;
  else if (len == 0 && sections[last] == 0)
    sections[last + 1] += ins;
  else if (forceJoin) {
    sections[last] += len;
    sections[last + 1] += ins;
  } else
    sections.push(len, ins);
};
var addInsert = function(values, sections, value) {
  if (value.length == 0)
    return;
  let index = sections.length - 2 >> 1;
  if (index < values.length) {
    values[values.length - 1] = values[values.length - 1].append(value);
  } else {
    while (values.length < index)
      values.push(Text.empty);
    values.push(value);
  }
};
var iterChanges = function(desc, f, individual) {
  let inserted = desc.inserted;
  for (let posA = 0, posB = 0, i = 0;i < desc.sections.length; ) {
    let len = desc.sections[i++], ins = desc.sections[i++];
    if (ins < 0) {
      posA += len;
      posB += len;
    } else {
      let endA = posA, endB = posB, text = Text.empty;
      for (;; ) {
        endA += len;
        endB += ins;
        if (ins && inserted)
          text = text.append(inserted[i - 2 >> 1]);
        if (individual || i == desc.sections.length || desc.sections[i + 1] < 0)
          break;
        len = desc.sections[i++];
        ins = desc.sections[i++];
      }
      f(posA, endA, posB, endB, text);
      posA = endA;
      posB = endB;
    }
  }
};
var mapSet = function(setA, setB, before, mkSet = false) {
  let sections = [], insert = mkSet ? [] : null;
  let a = new SectionIter(setA), b = new SectionIter(setB);
  for (let inserted = -1;; ) {
    if (a.ins == -1 && b.ins == -1) {
      let len = Math.min(a.len, b.len);
      addSection(sections, len, -1);
      a.forward(len);
      b.forward(len);
    } else if (b.ins >= 0 && (a.ins < 0 || inserted == a.i || a.off == 0 && (b.len < a.len || b.len == a.len && !before))) {
      let len = b.len;
      addSection(sections, b.ins, -1);
      while (len) {
        let piece = Math.min(a.len, len);
        if (a.ins >= 0 && inserted < a.i && a.len <= piece) {
          addSection(sections, 0, a.ins);
          if (insert)
            addInsert(insert, sections, a.text);
          inserted = a.i;
        }
        a.forward(piece);
        len -= piece;
      }
      b.next();
    } else if (a.ins >= 0) {
      let len = 0, left = a.len;
      while (left) {
        if (b.ins == -1) {
          let piece = Math.min(left, b.len);
          len += piece;
          left -= piece;
          b.forward(piece);
        } else if (b.ins == 0 && b.len < left) {
          left -= b.len;
          b.next();
        } else {
          break;
        }
      }
      addSection(sections, len, inserted < a.i ? a.ins : 0);
      if (insert && inserted < a.i)
        addInsert(insert, sections, a.text);
      inserted = a.i;
      a.forward(a.len - left);
    } else if (a.done && b.done) {
      return insert ? ChangeSet.createSet(sections, insert) : ChangeDesc.create(sections);
    } else {
      throw new Error("Mismatched change set lengths");
    }
  }
};
var composeSets = function(setA, setB, mkSet = false) {
  let sections = [];
  let insert = mkSet ? [] : null;
  let a = new SectionIter(setA), b = new SectionIter(setB);
  for (let open = false;; ) {
    if (a.done && b.done) {
      return insert ? ChangeSet.createSet(sections, insert) : ChangeDesc.create(sections);
    } else if (a.ins == 0) {
      addSection(sections, a.len, 0, open);
      a.next();
    } else if (b.len == 0 && !b.done) {
      addSection(sections, 0, b.ins, open);
      if (insert)
        addInsert(insert, sections, b.text);
      b.next();
    } else if (a.done || b.done) {
      throw new Error("Mismatched change set lengths");
    } else {
      let len = Math.min(a.len2, b.len), sectionLen = sections.length;
      if (a.ins == -1) {
        let insB = b.ins == -1 ? -1 : b.off ? 0 : b.ins;
        addSection(sections, len, insB, open);
        if (insert && insB)
          addInsert(insert, sections, b.text);
      } else if (b.ins == -1) {
        addSection(sections, a.off ? 0 : a.len, len, open);
        if (insert)
          addInsert(insert, sections, a.textBit(len));
      } else {
        addSection(sections, a.off ? 0 : a.len, b.off ? 0 : b.ins, open);
        if (insert && !b.off)
          addInsert(insert, sections, b.text);
      }
      open = (a.ins > len || b.ins >= 0 && b.len > len) && (open || sections.length > sectionLen);
      a.forward2(len);
      b.forward(len);
    }
  }
};
var checkSelection = function(selection, docLength) {
  for (let range of selection.ranges)
    if (range.to > docLength)
      throw new RangeError("Selection points outside of document");
};
var sameArray = function(a, b) {
  return a == b || a.length == b.length && a.every((e, i) => e === b[i]);
};
var compareArray = function(a, b, compare) {
  if (a.length != b.length)
    return false;
  for (let i = 0;i < a.length; i++)
    if (!compare(a[i], b[i]))
      return false;
  return true;
};
var ensureAll = function(state, addrs) {
  let changed = false;
  for (let addr of addrs)
    if (ensureAddr(state, addr) & 1)
      changed = true;
  return changed;
};
var dynamicFacetSlot = function(addresses, facet, providers) {
  let providerAddrs = providers.map((p) => addresses[p.id]);
  let providerTypes = providers.map((p) => p.type);
  let dynamic = providerAddrs.filter((p) => !(p & 1));
  let idx = addresses[facet.id] >> 1;
  function get(state) {
    let values = [];
    for (let i = 0;i < providerAddrs.length; i++) {
      let value = getAddr(state, providerAddrs[i]);
      if (providerTypes[i] == 2)
        for (let val of value)
          values.push(val);
      else
        values.push(value);
    }
    return facet.combine(values);
  }
  return {
    create(state) {
      for (let addr of providerAddrs)
        ensureAddr(state, addr);
      state.values[idx] = get(state);
      return 1;
    },
    update(state, tr) {
      if (!ensureAll(state, dynamic))
        return 0;
      let value = get(state);
      if (facet.compare(value, state.values[idx]))
        return 0;
      state.values[idx] = value;
      return 1;
    },
    reconfigure(state, oldState) {
      let depChanged = ensureAll(state, providerAddrs);
      let oldProviders = oldState.config.facets[facet.id], oldValue = oldState.facet(facet);
      if (oldProviders && !depChanged && sameArray(providers, oldProviders)) {
        state.values[idx] = oldValue;
        return 0;
      }
      let value = get(state);
      if (facet.compare(value, oldValue)) {
        state.values[idx] = oldValue;
        return 0;
      }
      state.values[idx] = value;
      return 1;
    }
  };
};
var prec = function(value) {
  return (ext) => new PrecExtension(ext, value);
};
var flatten = function(extension, compartments, newCompartments) {
  let result = [[], [], [], [], []];
  let seen = new Map;
  function inner(ext, prec2) {
    let known = seen.get(ext);
    if (known != null) {
      if (known <= prec2)
        return;
      let found = result[known].indexOf(ext);
      if (found > -1)
        result[known].splice(found, 1);
      if (ext instanceof CompartmentInstance)
        newCompartments.delete(ext.compartment);
    }
    seen.set(ext, prec2);
    if (Array.isArray(ext)) {
      for (let e of ext)
        inner(e, prec2);
    } else if (ext instanceof CompartmentInstance) {
      if (newCompartments.has(ext.compartment))
        throw new RangeError(`Duplicate use of compartment in extensions`);
      let content = compartments.get(ext.compartment) || ext.inner;
      newCompartments.set(ext.compartment, content);
      inner(content, prec2);
    } else if (ext instanceof PrecExtension) {
      inner(ext.inner, ext.prec);
    } else if (ext instanceof StateField) {
      result[prec2].push(ext);
      if (ext.provides)
        inner(ext.provides, prec2);
    } else if (ext instanceof FacetProvider) {
      result[prec2].push(ext);
      if (ext.facet.extensions)
        inner(ext.facet.extensions, Prec_.default);
    } else {
      let content = ext.extension;
      if (!content)
        throw new Error(`Unrecognized extension value in extension set (${ext}). This sometimes happens because multiple instances of @codemirror/state are loaded, breaking instanceof checks.`);
      inner(content, prec2);
    }
  }
  inner(extension, Prec_.default);
  return result.reduce((a, b) => a.concat(b));
};
var ensureAddr = function(state, addr) {
  if (addr & 1)
    return 2;
  let idx = addr >> 1;
  let status = state.status[idx];
  if (status == 4)
    throw new Error("Cyclic dependency between fields and/or facets");
  if (status & 2)
    return status;
  state.status[idx] = 4;
  let changed = state.computeSlot(state, state.config.dynamicSlots[idx]);
  return state.status[idx] = 2 | changed;
};
var getAddr = function(state, addr) {
  return addr & 1 ? state.config.staticValues[addr >> 1] : state.values[addr >> 1];
};
var joinRanges = function(a, b) {
  let result = [];
  for (let iA = 0, iB = 0;; ) {
    let from, to;
    if (iA < a.length && (iB == b.length || b[iB] >= a[iA])) {
      from = a[iA++];
      to = a[iA++];
    } else if (iB < b.length) {
      from = b[iB++];
      to = b[iB++];
    } else
      return result;
    if (!result.length || result[result.length - 1] < from)
      result.push(from, to);
    else if (result[result.length - 1] < to)
      result[result.length - 1] = to;
  }
};
var mergeTransaction = function(a, b, sequential) {
  var _a;
  let mapForA, mapForB, changes;
  if (sequential) {
    mapForA = b.changes;
    mapForB = ChangeSet.empty(b.changes.length);
    changes = a.changes.compose(b.changes);
  } else {
    mapForA = b.changes.map(a.changes);
    mapForB = a.changes.mapDesc(b.changes, true);
    changes = a.changes.compose(mapForA);
  }
  return {
    changes,
    selection: b.selection ? b.selection.map(mapForB) : (_a = a.selection) === null || _a === undefined ? undefined : _a.map(mapForA),
    effects: StateEffect.mapEffects(a.effects, mapForA).concat(StateEffect.mapEffects(b.effects, mapForB)),
    annotations: a.annotations.length ? a.annotations.concat(b.annotations) : b.annotations,
    scrollIntoView: a.scrollIntoView || b.scrollIntoView
  };
};
var resolveTransactionInner = function(state, spec, docSize) {
  let sel = spec.selection, annotations = asArray(spec.annotations);
  if (spec.userEvent)
    annotations = annotations.concat(Transaction.userEvent.of(spec.userEvent));
  return {
    changes: spec.changes instanceof ChangeSet ? spec.changes : ChangeSet.of(spec.changes || [], docSize, state.facet(lineSeparator)),
    selection: sel && (sel instanceof EditorSelection ? sel : EditorSelection.single(sel.anchor, sel.head)),
    effects: asArray(spec.effects),
    annotations,
    scrollIntoView: !!spec.scrollIntoView
  };
};
var resolveTransaction = function(state, specs, filter) {
  let s = resolveTransactionInner(state, specs.length ? specs[0] : {}, state.doc.length);
  if (specs.length && specs[0].filter === false)
    filter = false;
  for (let i = 1;i < specs.length; i++) {
    if (specs[i].filter === false)
      filter = false;
    let seq = !!specs[i].sequential;
    s = mergeTransaction(s, resolveTransactionInner(state, specs[i], seq ? s.changes.newLength : state.doc.length), seq);
  }
  let tr = Transaction.create(state, s.changes, s.selection, s.effects, s.annotations, s.scrollIntoView);
  return extendTransaction(filter ? filterTransaction(tr) : tr);
};
var filterTransaction = function(tr) {
  let state = tr.startState;
  let result = true;
  for (let filter of state.facet(changeFilter)) {
    let value = filter(tr);
    if (value === false) {
      result = false;
      break;
    }
    if (Array.isArray(value))
      result = result === true ? value : joinRanges(result, value);
  }
  if (result !== true) {
    let changes, back;
    if (result === false) {
      back = tr.changes.invertedDesc;
      changes = ChangeSet.empty(state.doc.length);
    } else {
      let filtered = tr.changes.filter(result);
      changes = filtered.changes;
      back = filtered.filtered.mapDesc(filtered.changes).invertedDesc;
    }
    tr = Transaction.create(state, changes, tr.selection && tr.selection.map(back), StateEffect.mapEffects(tr.effects, back), tr.annotations, tr.scrollIntoView);
  }
  let filters = state.facet(transactionFilter);
  for (let i = filters.length - 1;i >= 0; i--) {
    let filtered = filters[i](tr);
    if (filtered instanceof Transaction)
      tr = filtered;
    else if (Array.isArray(filtered) && filtered.length == 1 && filtered[0] instanceof Transaction)
      tr = filtered[0];
    else
      tr = resolveTransaction(state, asArray(filtered), false);
  }
  return tr;
};
var extendTransaction = function(tr) {
  let state = tr.startState, extenders = state.facet(transactionExtender), spec = tr;
  for (let i = extenders.length - 1;i >= 0; i--) {
    let extension = extenders[i](tr);
    if (extension && Object.keys(extension).length)
      spec = mergeTransaction(spec, resolveTransactionInner(state, extension, tr.changes.newLength), true);
  }
  return spec == tr ? tr : Transaction.create(state, tr.changes, tr.selection, spec.effects, spec.annotations, spec.scrollIntoView);
};
var asArray = function(value) {
  return value == null ? none : Array.isArray(value) ? value : [value];
};
var hasWordChar = function(str) {
  if (wordChar)
    return wordChar.test(str);
  for (let i = 0;i < str.length; i++) {
    let ch = str[i];
    if (/\w/.test(ch) || ch > "\x80" && (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch)))
      return true;
  }
  return false;
};
var makeCategorizer = function(wordChars) {
  return (char) => {
    if (!/\S/.test(char))
      return CharCategory.Space;
    if (hasWordChar(char))
      return CharCategory.Word;
    for (let i = 0;i < wordChars.length; i++)
      if (char.indexOf(wordChars[i]) > -1)
        return CharCategory.Word;
    return CharCategory.Other;
  };
};
var combineConfig = function(configs, defaults, combine = {}) {
  let result = {};
  for (let config of configs)
    for (let key of Object.keys(config)) {
      let value = config[key], current = result[key];
      if (current === undefined)
        result[key] = value;
      else if (current === value || value === undefined)
        ;
      else if (Object.hasOwnProperty.call(combine, key))
        result[key] = combine[key](current, value);
      else
        throw new Error("Config merge conflict for field " + key);
    }
  for (let key in defaults)
    if (result[key] === undefined)
      result[key] = defaults[key];
  return result;
};
var cmpRange = function(a, b) {
  return a.from - b.from || a.value.startSide - b.value.startSide;
};
var lazySort = function(ranges) {
  if (ranges.length > 1)
    for (let prev = ranges[0], i = 1;i < ranges.length; i++) {
      let cur = ranges[i];
      if (cmpRange(prev, cur) > 0)
        return ranges.slice().sort(cmpRange);
      prev = cur;
    }
  return ranges;
};
var findSharedChunks = function(a, b, textDiff) {
  let inA = new Map;
  for (let set of a)
    for (let i = 0;i < set.chunk.length; i++)
      if (set.chunk[i].maxPoint <= 0)
        inA.set(set.chunk[i], set.chunkPos[i]);
  let shared = new Set;
  for (let set of b)
    for (let i = 0;i < set.chunk.length; i++) {
      let known = inA.get(set.chunk[i]);
      if (known != null && (textDiff ? textDiff.mapPos(known) : known) == set.chunkPos[i] && !(textDiff === null || textDiff === undefined ? undefined : textDiff.touchesRange(known, known + set.chunk[i].length)))
        shared.add(set.chunk[i]);
    }
  return shared;
};
var heapBubble = function(heap, index) {
  for (let cur = heap[index];; ) {
    let childIndex = (index << 1) + 1;
    if (childIndex >= heap.length)
      break;
    let child = heap[childIndex];
    if (childIndex + 1 < heap.length && child.compare(heap[childIndex + 1]) >= 0) {
      child = heap[childIndex + 1];
      childIndex++;
    }
    if (cur.compare(child) < 0)
      break;
    heap[childIndex] = cur;
    heap[index] = child;
    index = childIndex;
  }
};
var compare = function(a, startA, b, startB, length, comparator) {
  a.goto(startA);
  b.goto(startB);
  let endB = startB + length;
  let pos = startB, dPos = startB - startA;
  for (;; ) {
    let diff = a.to + dPos - b.to || a.endSide - b.endSide;
    let end = diff < 0 ? a.to + dPos : b.to, clipEnd = Math.min(end, endB);
    if (a.point || b.point) {
      if (!(a.point && b.point && (a.point == b.point || a.point.eq(b.point)) && sameValues(a.activeForPoint(a.to), b.activeForPoint(b.to))))
        comparator.comparePoint(pos, clipEnd, a.point, b.point);
    } else {
      if (clipEnd > pos && !sameValues(a.active, b.active))
        comparator.compareRange(pos, clipEnd, a.active, b.active);
    }
    if (end > endB)
      break;
    pos = end;
    if (diff <= 0)
      a.next();
    if (diff >= 0)
      b.next();
  }
};
var sameValues = function(a, b) {
  if (a.length != b.length)
    return false;
  for (let i = 0;i < a.length; i++)
    if (a[i] != b[i] && !a[i].eq(b[i]))
      return false;
  return true;
};
var remove = function(array, index) {
  for (let i = index, e = array.length - 1;i < e; i++)
    array[i] = array[i + 1];
  array.pop();
};
var insert = function(array, index, value) {
  for (let i = array.length - 1;i >= index; i--)
    array[i + 1] = array[i];
  array[index] = value;
};
var findMinIndex = function(value, array) {
  let found = -1, foundPos = 1e9;
  for (let i = 0;i < array.length; i++)
    if ((array[i] - foundPos || value[i].endSide - value[found].endSide) < 0) {
      found = i;
      foundPos = array[i];
    }
  return found;
};
var countColumn = function(string, tabSize, to = string.length) {
  let n = 0;
  for (let i = 0;i < to; ) {
    if (string.charCodeAt(i) == 9) {
      n += tabSize - n % tabSize;
      i++;
    } else {
      n++;
      i = findClusterBreak(string, i);
    }
  }
  return n;
};
var findColumn = function(string, col, tabSize, strict) {
  for (let i = 0, n = 0;; ) {
    if (n >= col)
      return i;
    if (i == string.length)
      break;
    n += string.charCodeAt(i) == 9 ? tabSize - n % tabSize : 1;
    i = findClusterBreak(string, i);
  }
  return strict === true ? -1 : string.length;
};

class Text {
  lineAt(pos) {
    if (pos < 0 || pos > this.length)
      throw new RangeError(`Invalid position ${pos} in document of length ${this.length}`);
    return this.lineInner(pos, false, 1, 0);
  }
  line(n) {
    if (n < 1 || n > this.lines)
      throw new RangeError(`Invalid line number ${n} in ${this.lines}-line document`);
    return this.lineInner(n, true, 1, 0);
  }
  replace(from, to, text) {
    let parts = [];
    this.decompose(0, from, parts, 2);
    if (text.length)
      text.decompose(0, text.length, parts, 1 | 2);
    this.decompose(to, this.length, parts, 1);
    return TextNode.from(parts, this.length - (to - from) + text.length);
  }
  append(other) {
    return this.replace(this.length, this.length, other);
  }
  slice(from, to = this.length) {
    let parts = [];
    this.decompose(from, to, parts, 0);
    return TextNode.from(parts, to - from);
  }
  eq(other) {
    if (other == this)
      return true;
    if (other.length != this.length || other.lines != this.lines)
      return false;
    let start = this.scanIdentical(other, 1), end = this.length - this.scanIdentical(other, -1);
    let a = new RawTextCursor(this), b = new RawTextCursor(other);
    for (let skip = start, pos = start;; ) {
      a.next(skip);
      b.next(skip);
      skip = 0;
      if (a.lineBreak != b.lineBreak || a.done != b.done || a.value != b.value)
        return false;
      pos += a.value.length;
      if (a.done || pos >= end)
        return true;
    }
  }
  iter(dir = 1) {
    return new RawTextCursor(this, dir);
  }
  iterRange(from, to = this.length) {
    return new PartialTextCursor(this, from, to);
  }
  iterLines(from, to) {
    let inner;
    if (from == null) {
      inner = this.iter();
    } else {
      if (to == null)
        to = this.lines + 1;
      let start = this.line(from).from;
      inner = this.iterRange(start, Math.max(start, to == this.lines + 1 ? this.length : to <= 1 ? 0 : this.line(to - 1).to));
    }
    return new LineCursor(inner);
  }
  toString() {
    return this.sliceString(0);
  }
  toJSON() {
    let lines = [];
    this.flatten(lines);
    return lines;
  }
  constructor() {
  }
  static of(text) {
    if (text.length == 0)
      throw new RangeError("A document must have at least one line");
    if (text.length == 1 && !text[0])
      return Text.empty;
    return text.length <= 32 ? new TextLeaf(text) : TextNode.from(TextLeaf.split(text, []));
  }
}

class TextLeaf extends Text {
  constructor(text, length = textLength(text)) {
    super();
    this.text = text;
    this.length = length;
  }
  get lines() {
    return this.text.length;
  }
  get children() {
    return null;
  }
  lineInner(target, isLine, line, offset) {
    for (let i = 0;; i++) {
      let string = this.text[i], end = offset + string.length;
      if ((isLine ? line : end) >= target)
        return new Line(offset, end, line, string);
      offset = end + 1;
      line++;
    }
  }
  decompose(from, to, target, open) {
    let text = from <= 0 && to >= this.length ? this : new TextLeaf(sliceText(this.text, from, to), Math.min(to, this.length) - Math.max(0, from));
    if (open & 1) {
      let prev = target.pop();
      let joined = appendText(text.text, prev.text.slice(), 0, text.length);
      if (joined.length <= 32) {
        target.push(new TextLeaf(joined, prev.length + text.length));
      } else {
        let mid = joined.length >> 1;
        target.push(new TextLeaf(joined.slice(0, mid)), new TextLeaf(joined.slice(mid)));
      }
    } else {
      target.push(text);
    }
  }
  replace(from, to, text) {
    if (!(text instanceof TextLeaf))
      return super.replace(from, to, text);
    let lines = appendText(this.text, appendText(text.text, sliceText(this.text, 0, from)), to);
    let newLen = this.length + text.length - (to - from);
    if (lines.length <= 32)
      return new TextLeaf(lines, newLen);
    return TextNode.from(TextLeaf.split(lines, []), newLen);
  }
  sliceString(from, to = this.length, lineSep = "\n") {
    let result = "";
    for (let pos = 0, i = 0;pos <= to && i < this.text.length; i++) {
      let line = this.text[i], end = pos + line.length;
      if (pos > from && i)
        result += lineSep;
      if (from < end && to > pos)
        result += line.slice(Math.max(0, from - pos), to - pos);
      pos = end + 1;
    }
    return result;
  }
  flatten(target) {
    for (let line of this.text)
      target.push(line);
  }
  scanIdentical() {
    return 0;
  }
  static split(text, target) {
    let part = [], len = -1;
    for (let line of text) {
      part.push(line);
      len += line.length + 1;
      if (part.length == 32) {
        target.push(new TextLeaf(part, len));
        part = [];
        len = -1;
      }
    }
    if (len > -1)
      target.push(new TextLeaf(part, len));
    return target;
  }
}

class TextNode extends Text {
  constructor(children, length) {
    super();
    this.children = children;
    this.length = length;
    this.lines = 0;
    for (let child of children)
      this.lines += child.lines;
  }
  lineInner(target, isLine, line, offset) {
    for (let i = 0;; i++) {
      let child = this.children[i], end = offset + child.length, endLine = line + child.lines - 1;
      if ((isLine ? endLine : end) >= target)
        return child.lineInner(target, isLine, line, offset);
      offset = end + 1;
      line = endLine + 1;
    }
  }
  decompose(from, to, target, open) {
    for (let i = 0, pos = 0;pos <= to && i < this.children.length; i++) {
      let child = this.children[i], end = pos + child.length;
      if (from <= end && to >= pos) {
        let childOpen = open & ((pos <= from ? 1 : 0) | (end >= to ? 2 : 0));
        if (pos >= from && end <= to && !childOpen)
          target.push(child);
        else
          child.decompose(from - pos, to - pos, target, childOpen);
      }
      pos = end + 1;
    }
  }
  replace(from, to, text) {
    if (text.lines < this.lines)
      for (let i = 0, pos = 0;i < this.children.length; i++) {
        let child = this.children[i], end = pos + child.length;
        if (from >= pos && to <= end) {
          let updated = child.replace(from - pos, to - pos, text);
          let totalLines = this.lines - child.lines + updated.lines;
          if (updated.lines < totalLines >> 5 - 1 && updated.lines > totalLines >> 5 + 1) {
            let copy = this.children.slice();
            copy[i] = updated;
            return new TextNode(copy, this.length - (to - from) + text.length);
          }
          return super.replace(pos, end, updated);
        }
        pos = end + 1;
      }
    return super.replace(from, to, text);
  }
  sliceString(from, to = this.length, lineSep = "\n") {
    let result = "";
    for (let i = 0, pos = 0;i < this.children.length && pos <= to; i++) {
      let child = this.children[i], end = pos + child.length;
      if (pos > from && i)
        result += lineSep;
      if (from < end && to > pos)
        result += child.sliceString(from - pos, to - pos, lineSep);
      pos = end + 1;
    }
    return result;
  }
  flatten(target) {
    for (let child of this.children)
      child.flatten(target);
  }
  scanIdentical(other, dir) {
    if (!(other instanceof TextNode))
      return 0;
    let length = 0;
    let [iA, iB, eA, eB] = dir > 0 ? [0, 0, this.children.length, other.children.length] : [this.children.length - 1, other.children.length - 1, -1, -1];
    for (;; iA += dir, iB += dir) {
      if (iA == eA || iB == eB)
        return length;
      let chA = this.children[iA], chB = other.children[iB];
      if (chA != chB)
        return length + chA.scanIdentical(chB, dir);
      length += chA.length + 1;
    }
  }
  static from(children, length = children.reduce((l, ch) => l + ch.length + 1, -1)) {
    let lines = 0;
    for (let ch of children)
      lines += ch.lines;
    if (lines < 32) {
      let flat = [];
      for (let ch of children)
        ch.flatten(flat);
      return new TextLeaf(flat, length);
    }
    let chunk = Math.max(32, lines >> 5), maxChunk = chunk << 1, minChunk = chunk >> 1;
    let chunked = [], currentLines = 0, currentLen = -1, currentChunk = [];
    function add(child) {
      let last;
      if (child.lines > maxChunk && child instanceof TextNode) {
        for (let node of child.children)
          add(node);
      } else if (child.lines > minChunk && (currentLines > minChunk || !currentLines)) {
        flush();
        chunked.push(child);
      } else if (child instanceof TextLeaf && currentLines && (last = currentChunk[currentChunk.length - 1]) instanceof TextLeaf && child.lines + last.lines <= 32) {
        currentLines += child.lines;
        currentLen += child.length + 1;
        currentChunk[currentChunk.length - 1] = new TextLeaf(last.text.concat(child.text), last.length + 1 + child.length);
      } else {
        if (currentLines + child.lines > chunk)
          flush();
        currentLines += child.lines;
        currentLen += child.length + 1;
        currentChunk.push(child);
      }
    }
    function flush() {
      if (currentLines == 0)
        return;
      chunked.push(currentChunk.length == 1 ? currentChunk[0] : TextNode.from(currentChunk, currentLen));
      currentLen = -1;
      currentLines = currentChunk.length = 0;
    }
    for (let child of children)
      add(child);
    flush();
    return chunked.length == 1 ? chunked[0] : new TextNode(chunked, length);
  }
}
Text.empty = new TextLeaf([""], 0);

class RawTextCursor {
  constructor(text, dir = 1) {
    this.dir = dir;
    this.done = false;
    this.lineBreak = false;
    this.value = "";
    this.nodes = [text];
    this.offsets = [dir > 0 ? 1 : (text instanceof TextLeaf ? text.text.length : text.children.length) << 1];
  }
  nextInner(skip, dir) {
    this.done = this.lineBreak = false;
    for (;; ) {
      let last = this.nodes.length - 1;
      let top = this.nodes[last], offsetValue = this.offsets[last], offset = offsetValue >> 1;
      let size = top instanceof TextLeaf ? top.text.length : top.children.length;
      if (offset == (dir > 0 ? size : 0)) {
        if (last == 0) {
          this.done = true;
          this.value = "";
          return this;
        }
        if (dir > 0)
          this.offsets[last - 1]++;
        this.nodes.pop();
        this.offsets.pop();
      } else if ((offsetValue & 1) == (dir > 0 ? 0 : 1)) {
        this.offsets[last] += dir;
        if (skip == 0) {
          this.lineBreak = true;
          this.value = "\n";
          return this;
        }
        skip--;
      } else if (top instanceof TextLeaf) {
        let next = top.text[offset + (dir < 0 ? -1 : 0)];
        this.offsets[last] += dir;
        if (next.length > Math.max(0, skip)) {
          this.value = skip == 0 ? next : dir > 0 ? next.slice(skip) : next.slice(0, next.length - skip);
          return this;
        }
        skip -= next.length;
      } else {
        let next = top.children[offset + (dir < 0 ? -1 : 0)];
        if (skip > next.length) {
          skip -= next.length;
          this.offsets[last] += dir;
        } else {
          if (dir < 0)
            this.offsets[last]--;
          this.nodes.push(next);
          this.offsets.push(dir > 0 ? 1 : (next instanceof TextLeaf ? next.text.length : next.children.length) << 1);
        }
      }
    }
  }
  next(skip = 0) {
    if (skip < 0) {
      this.nextInner(-skip, -this.dir);
      skip = this.value.length;
    }
    return this.nextInner(skip, this.dir);
  }
}

class PartialTextCursor {
  constructor(text, start, end) {
    this.value = "";
    this.done = false;
    this.cursor = new RawTextCursor(text, start > end ? -1 : 1);
    this.pos = start > end ? text.length : 0;
    this.from = Math.min(start, end);
    this.to = Math.max(start, end);
  }
  nextInner(skip, dir) {
    if (dir < 0 ? this.pos <= this.from : this.pos >= this.to) {
      this.value = "";
      this.done = true;
      return this;
    }
    skip += Math.max(0, dir < 0 ? this.pos - this.to : this.from - this.pos);
    let limit = dir < 0 ? this.pos - this.from : this.to - this.pos;
    if (skip > limit)
      skip = limit;
    limit -= skip;
    let { value } = this.cursor.next(skip);
    this.pos += (value.length + skip) * dir;
    this.value = value.length <= limit ? value : dir < 0 ? value.slice(value.length - limit) : value.slice(0, limit);
    this.done = !this.value;
    return this;
  }
  next(skip = 0) {
    if (skip < 0)
      skip = Math.max(skip, this.from - this.pos);
    else if (skip > 0)
      skip = Math.min(skip, this.to - this.pos);
    return this.nextInner(skip, this.cursor.dir);
  }
  get lineBreak() {
    return this.cursor.lineBreak && this.value != "";
  }
}

class LineCursor {
  constructor(inner) {
    this.inner = inner;
    this.afterBreak = true;
    this.value = "";
    this.done = false;
  }
  next(skip = 0) {
    let { done, lineBreak, value } = this.inner.next(skip);
    if (done) {
      this.done = true;
      this.value = "";
    } else if (lineBreak) {
      if (this.afterBreak) {
        this.value = "";
      } else {
        this.afterBreak = true;
        this.next();
      }
    } else {
      this.value = value;
      this.afterBreak = false;
    }
    return this;
  }
  get lineBreak() {
    return false;
  }
}
if (typeof Symbol != "undefined") {
  Text.prototype[Symbol.iterator] = function() {
    return this.iter();
  };
  RawTextCursor.prototype[Symbol.iterator] = PartialTextCursor.prototype[Symbol.iterator] = LineCursor.prototype[Symbol.iterator] = function() {
    return this;
  };
}

class Line {
  constructor(from, to, number, text) {
    this.from = from;
    this.to = to;
    this.number = number;
    this.text = text;
  }
  get length() {
    return this.to - this.from;
  }
}
var extend = "lc,34,7n,7,7b,19,,,,2,,2,,,20,b,1c,l,g,,2t,7,2,6,2,2,,4,z,,u,r,2j,b,1m,9,9,,o,4,,9,,3,,5,17,3,3b,f,,w,1j,,,,4,8,4,,3,7,a,2,t,,1m,,,,2,4,8,,9,,a,2,q,,2,2,1l,,4,2,4,2,2,3,3,,u,2,3,,b,2,1l,,4,5,,2,4,,k,2,m,6,,,1m,,,2,,4,8,,7,3,a,2,u,,1n,,,,c,,9,,14,,3,,1l,3,5,3,,4,7,2,b,2,t,,1m,,2,,2,,3,,5,2,7,2,b,2,s,2,1l,2,,,2,4,8,,9,,a,2,t,,20,,4,,2,3,,,8,,29,,2,7,c,8,2q,,2,9,b,6,22,2,r,,,,,,1j,e,,5,,2,5,b,,10,9,,2u,4,,6,,2,2,2,p,2,4,3,g,4,d,,2,2,6,,f,,jj,3,qa,3,t,3,t,2,u,2,1s,2,,7,8,,2,b,9,,19,3,3b,2,y,,3a,3,4,2,9,,6,3,63,2,2,,1m,,,7,,,,,2,8,6,a,2,,1c,h,1r,4,1c,7,,,5,,14,9,c,2,w,4,2,2,,3,1k,,,2,3,,,3,1m,8,2,2,48,3,,d,,7,4,,6,,3,2,5i,1m,,5,ek,,5f,x,2da,3,3x,,2o,w,fe,6,2x,2,n9w,4,,a,w,2,28,2,7k,,3,,4,,p,2,5,,47,2,q,i,d,,12,8,p,b,1a,3,1c,,2,4,2,2,13,,1v,6,2,2,2,2,c,,8,,1b,,1f,,,3,2,2,5,2,,,16,2,8,,6m,,2,,4,,fn4,,kh,g,g,g,a6,2,gt,,6a,,45,5,1ae,3,,2,5,4,14,3,4,,4l,2,fx,4,ar,2,49,b,4w,,1i,f,1k,3,1d,4,2,2,1x,3,10,5,,8,1q,,c,2,1g,9,a,4,2,,2n,3,2,,,2,6,,4g,,3,8,l,2,1l,2,,,,,m,,e,7,3,5,5f,8,2,3,,,n,,29,,2,6,,,2,,,2,,2,6j,,2,4,6,2,,2,r,2,2d,8,2,,,2,2y,,,,2,6,,,2t,3,2,4,,5,77,9,,2,6t,,a,2,,,4,,40,4,2,2,4,,w,a,14,6,2,4,8,,9,6,2,3,1a,d,,2,ba,7,,6,,,2a,m,2,7,,2,,2,3e,6,3,,,2,,7,,,20,2,3,,,,9n,2,f0b,5,1n,7,t4,,1r,4,29,,f5k,2,43q,,,3,4,5,8,8,2,7,u,4,44,3,1iz,1j,4,1e,8,,e,,m,5,,f,11s,7,,h,2,7,,2,,5,79,7,c5,4,15s,7,31,7,240,5,gx7k,2o,3k,6o".split(",").map((s) => s ? parseInt(s, 36) : 1);
for (let i = 1;i < extend.length; i++)
  extend[i] += extend[i - 1];
var ZWJ = 8205;
var DefaultSplit = /\r\n?|\n/;
var MapMode = function(MapMode2) {
  MapMode2[MapMode2["Simple"] = 0] = "Simple";
  MapMode2[MapMode2["TrackDel"] = 1] = "TrackDel";
  MapMode2[MapMode2["TrackBefore"] = 2] = "TrackBefore";
  MapMode2[MapMode2["TrackAfter"] = 3] = "TrackAfter";
  return MapMode2;
}(MapMode || (MapMode = {}));

class ChangeDesc {
  constructor(sections) {
    this.sections = sections;
  }
  get length() {
    let result = 0;
    for (let i = 0;i < this.sections.length; i += 2)
      result += this.sections[i];
    return result;
  }
  get newLength() {
    let result = 0;
    for (let i = 0;i < this.sections.length; i += 2) {
      let ins = this.sections[i + 1];
      result += ins < 0 ? this.sections[i] : ins;
    }
    return result;
  }
  get empty() {
    return this.sections.length == 0 || this.sections.length == 2 && this.sections[1] < 0;
  }
  iterGaps(f) {
    for (let i = 0, posA = 0, posB = 0;i < this.sections.length; ) {
      let len = this.sections[i++], ins = this.sections[i++];
      if (ins < 0) {
        f(posA, posB, len);
        posB += len;
      } else {
        posB += ins;
      }
      posA += len;
    }
  }
  iterChangedRanges(f, individual = false) {
    iterChanges(this, f, individual);
  }
  get invertedDesc() {
    let sections = [];
    for (let i = 0;i < this.sections.length; ) {
      let len = this.sections[i++], ins = this.sections[i++];
      if (ins < 0)
        sections.push(len, ins);
      else
        sections.push(ins, len);
    }
    return new ChangeDesc(sections);
  }
  composeDesc(other) {
    return this.empty ? other : other.empty ? this : composeSets(this, other);
  }
  mapDesc(other, before = false) {
    return other.empty ? this : mapSet(this, other, before);
  }
  mapPos(pos, assoc = -1, mode = MapMode.Simple) {
    let posA = 0, posB = 0;
    for (let i = 0;i < this.sections.length; ) {
      let len = this.sections[i++], ins = this.sections[i++], endA = posA + len;
      if (ins < 0) {
        if (endA > pos)
          return posB + (pos - posA);
        posB += len;
      } else {
        if (mode != MapMode.Simple && endA >= pos && (mode == MapMode.TrackDel && posA < pos && endA > pos || mode == MapMode.TrackBefore && posA < pos || mode == MapMode.TrackAfter && endA > pos))
          return null;
        if (endA > pos || endA == pos && assoc < 0 && !len)
          return pos == posA || assoc < 0 ? posB : posB + ins;
        posB += ins;
      }
      posA = endA;
    }
    if (pos > posA)
      throw new RangeError(`Position ${pos} is out of range for changeset of length ${posA}`);
    return posB;
  }
  touchesRange(from, to = from) {
    for (let i = 0, pos = 0;i < this.sections.length && pos <= to; ) {
      let len = this.sections[i++], ins = this.sections[i++], end = pos + len;
      if (ins >= 0 && pos <= to && end >= from)
        return pos < from && end > to ? "cover" : true;
      pos = end;
    }
    return false;
  }
  toString() {
    let result = "";
    for (let i = 0;i < this.sections.length; ) {
      let len = this.sections[i++], ins = this.sections[i++];
      result += (result ? " " : "") + len + (ins >= 0 ? ":" + ins : "");
    }
    return result;
  }
  toJSON() {
    return this.sections;
  }
  static fromJSON(json) {
    if (!Array.isArray(json) || json.length % 2 || json.some((a) => typeof a != "number"))
      throw new RangeError("Invalid JSON representation of ChangeDesc");
    return new ChangeDesc(json);
  }
  static create(sections) {
    return new ChangeDesc(sections);
  }
}

class ChangeSet extends ChangeDesc {
  constructor(sections, inserted) {
    super(sections);
    this.inserted = inserted;
  }
  apply(doc) {
    if (this.length != doc.length)
      throw new RangeError("Applying change set to a document with the wrong length");
    iterChanges(this, (fromA, toA, fromB, _toB, text) => doc = doc.replace(fromB, fromB + (toA - fromA), text), false);
    return doc;
  }
  mapDesc(other, before = false) {
    return mapSet(this, other, before, true);
  }
  invert(doc) {
    let sections = this.sections.slice(), inserted = [];
    for (let i = 0, pos = 0;i < sections.length; i += 2) {
      let len = sections[i], ins = sections[i + 1];
      if (ins >= 0) {
        sections[i] = ins;
        sections[i + 1] = len;
        let index = i >> 1;
        while (inserted.length < index)
          inserted.push(Text.empty);
        inserted.push(len ? doc.slice(pos, pos + len) : Text.empty);
      }
      pos += len;
    }
    return new ChangeSet(sections, inserted);
  }
  compose(other) {
    return this.empty ? other : other.empty ? this : composeSets(this, other, true);
  }
  map(other, before = false) {
    return other.empty ? this : mapSet(this, other, before, true);
  }
  iterChanges(f, individual = false) {
    iterChanges(this, f, individual);
  }
  get desc() {
    return ChangeDesc.create(this.sections);
  }
  filter(ranges) {
    let resultSections = [], resultInserted = [], filteredSections = [];
    let iter = new SectionIter(this);
    done:
      for (let i = 0, pos = 0;; ) {
        let next = i == ranges.length ? 1e9 : ranges[i++];
        while (pos < next || pos == next && iter.len == 0) {
          if (iter.done)
            break done;
          let len = Math.min(iter.len, next - pos);
          addSection(filteredSections, len, -1);
          let ins = iter.ins == -1 ? -1 : iter.off == 0 ? iter.ins : 0;
          addSection(resultSections, len, ins);
          if (ins > 0)
            addInsert(resultInserted, resultSections, iter.text);
          iter.forward(len);
          pos += len;
        }
        let end = ranges[i++];
        while (pos < end) {
          if (iter.done)
            break done;
          let len = Math.min(iter.len, end - pos);
          addSection(resultSections, len, -1);
          addSection(filteredSections, len, iter.ins == -1 ? -1 : iter.off == 0 ? iter.ins : 0);
          iter.forward(len);
          pos += len;
        }
      }
    return {
      changes: new ChangeSet(resultSections, resultInserted),
      filtered: ChangeDesc.create(filteredSections)
    };
  }
  toJSON() {
    let parts = [];
    for (let i = 0;i < this.sections.length; i += 2) {
      let len = this.sections[i], ins = this.sections[i + 1];
      if (ins < 0)
        parts.push(len);
      else if (ins == 0)
        parts.push([len]);
      else
        parts.push([len].concat(this.inserted[i >> 1].toJSON()));
    }
    return parts;
  }
  static of(changes, length, lineSep) {
    let sections = [], inserted = [], pos = 0;
    let total = null;
    function flush(force = false) {
      if (!force && !sections.length)
        return;
      if (pos < length)
        addSection(sections, length - pos, -1);
      let set = new ChangeSet(sections, inserted);
      total = total ? total.compose(set.map(total)) : set;
      sections = [];
      inserted = [];
      pos = 0;
    }
    function process2(spec) {
      if (Array.isArray(spec)) {
        for (let sub of spec)
          process2(sub);
      } else if (spec instanceof ChangeSet) {
        if (spec.length != length)
          throw new RangeError(`Mismatched change set length (got ${spec.length}, expected ${length})`);
        flush();
        total = total ? total.compose(spec.map(total)) : spec;
      } else {
        let { from, to = from, insert: insert2 } = spec;
        if (from > to || from < 0 || to > length)
          throw new RangeError(`Invalid change range ${from} to ${to} (in doc of length ${length})`);
        let insText = !insert2 ? Text.empty : typeof insert2 == "string" ? Text.of(insert2.split(lineSep || DefaultSplit)) : insert2;
        let insLen = insText.length;
        if (from == to && insLen == 0)
          return;
        if (from < pos)
          flush();
        if (from > pos)
          addSection(sections, from - pos, -1);
        addSection(sections, to - from, insLen);
        addInsert(inserted, sections, insText);
        pos = to;
      }
    }
    process2(changes);
    flush(!total);
    return total;
  }
  static empty(length) {
    return new ChangeSet(length ? [length, -1] : [], []);
  }
  static fromJSON(json) {
    if (!Array.isArray(json))
      throw new RangeError("Invalid JSON representation of ChangeSet");
    let sections = [], inserted = [];
    for (let i = 0;i < json.length; i++) {
      let part = json[i];
      if (typeof part == "number") {
        sections.push(part, -1);
      } else if (!Array.isArray(part) || typeof part[0] != "number" || part.some((e, i2) => i2 && typeof e != "string")) {
        throw new RangeError("Invalid JSON representation of ChangeSet");
      } else if (part.length == 1) {
        sections.push(part[0], 0);
      } else {
        while (inserted.length < i)
          inserted.push(Text.empty);
        inserted[i] = Text.of(part.slice(1));
        sections.push(part[0], inserted[i].length);
      }
    }
    return new ChangeSet(sections, inserted);
  }
  static createSet(sections, inserted) {
    return new ChangeSet(sections, inserted);
  }
}

class SectionIter {
  constructor(set) {
    this.set = set;
    this.i = 0;
    this.next();
  }
  next() {
    let { sections } = this.set;
    if (this.i < sections.length) {
      this.len = sections[this.i++];
      this.ins = sections[this.i++];
    } else {
      this.len = 0;
      this.ins = -2;
    }
    this.off = 0;
  }
  get done() {
    return this.ins == -2;
  }
  get len2() {
    return this.ins < 0 ? this.len : this.ins;
  }
  get text() {
    let { inserted } = this.set, index = this.i - 2 >> 1;
    return index >= inserted.length ? Text.empty : inserted[index];
  }
  textBit(len) {
    let { inserted } = this.set, index = this.i - 2 >> 1;
    return index >= inserted.length && !len ? Text.empty : inserted[index].slice(this.off, len == null ? undefined : this.off + len);
  }
  forward(len) {
    if (len == this.len)
      this.next();
    else {
      this.len -= len;
      this.off += len;
    }
  }
  forward2(len) {
    if (this.ins == -1)
      this.forward(len);
    else if (len == this.ins)
      this.next();
    else {
      this.ins -= len;
      this.off += len;
    }
  }
}

class SelectionRange {
  constructor(from, to, flags) {
    this.from = from;
    this.to = to;
    this.flags = flags;
  }
  get anchor() {
    return this.flags & 16 ? this.to : this.from;
  }
  get head() {
    return this.flags & 16 ? this.from : this.to;
  }
  get empty() {
    return this.from == this.to;
  }
  get assoc() {
    return this.flags & 4 ? -1 : this.flags & 8 ? 1 : 0;
  }
  get bidiLevel() {
    let level = this.flags & 3;
    return level == 3 ? null : level;
  }
  get goalColumn() {
    let value = this.flags >> 5;
    return value == 33554431 ? undefined : value;
  }
  map(change, assoc = -1) {
    let from, to;
    if (this.empty) {
      from = to = change.mapPos(this.from, assoc);
    } else {
      from = change.mapPos(this.from, 1);
      to = change.mapPos(this.to, -1);
    }
    return from == this.from && to == this.to ? this : new SelectionRange(from, to, this.flags);
  }
  extend(from, to = from) {
    if (from <= this.anchor && to >= this.anchor)
      return EditorSelection.range(from, to);
    let head = Math.abs(from - this.anchor) > Math.abs(to - this.anchor) ? from : to;
    return EditorSelection.range(this.anchor, head);
  }
  eq(other) {
    return this.anchor == other.anchor && this.head == other.head;
  }
  toJSON() {
    return { anchor: this.anchor, head: this.head };
  }
  static fromJSON(json) {
    if (!json || typeof json.anchor != "number" || typeof json.head != "number")
      throw new RangeError("Invalid JSON representation for SelectionRange");
    return EditorSelection.range(json.anchor, json.head);
  }
  static create(from, to, flags) {
    return new SelectionRange(from, to, flags);
  }
}

class EditorSelection {
  constructor(ranges, mainIndex) {
    this.ranges = ranges;
    this.mainIndex = mainIndex;
  }
  map(change, assoc = -1) {
    if (change.empty)
      return this;
    return EditorSelection.create(this.ranges.map((r) => r.map(change, assoc)), this.mainIndex);
  }
  eq(other) {
    if (this.ranges.length != other.ranges.length || this.mainIndex != other.mainIndex)
      return false;
    for (let i = 0;i < this.ranges.length; i++)
      if (!this.ranges[i].eq(other.ranges[i]))
        return false;
    return true;
  }
  get main() {
    return this.ranges[this.mainIndex];
  }
  asSingle() {
    return this.ranges.length == 1 ? this : new EditorSelection([this.main], 0);
  }
  addRange(range, main = true) {
    return EditorSelection.create([range].concat(this.ranges), main ? 0 : this.mainIndex + 1);
  }
  replaceRange(range, which = this.mainIndex) {
    let ranges = this.ranges.slice();
    ranges[which] = range;
    return EditorSelection.create(ranges, this.mainIndex);
  }
  toJSON() {
    return { ranges: this.ranges.map((r) => r.toJSON()), main: this.mainIndex };
  }
  static fromJSON(json) {
    if (!json || !Array.isArray(json.ranges) || typeof json.main != "number" || json.main >= json.ranges.length)
      throw new RangeError("Invalid JSON representation for EditorSelection");
    return new EditorSelection(json.ranges.map((r) => SelectionRange.fromJSON(r)), json.main);
  }
  static single(anchor, head = anchor) {
    return new EditorSelection([EditorSelection.range(anchor, head)], 0);
  }
  static create(ranges, mainIndex = 0) {
    if (ranges.length == 0)
      throw new RangeError("A selection needs at least one range");
    for (let pos = 0, i = 0;i < ranges.length; i++) {
      let range = ranges[i];
      if (range.empty ? range.from <= pos : range.from < pos)
        return EditorSelection.normalized(ranges.slice(), mainIndex);
      pos = range.to;
    }
    return new EditorSelection(ranges, mainIndex);
  }
  static cursor(pos, assoc = 0, bidiLevel, goalColumn) {
    return SelectionRange.create(pos, pos, (assoc == 0 ? 0 : assoc < 0 ? 4 : 8) | (bidiLevel == null ? 3 : Math.min(2, bidiLevel)) | (goalColumn !== null && goalColumn !== undefined ? goalColumn : 33554431) << 5);
  }
  static range(anchor, head, goalColumn, bidiLevel) {
    let flags = (goalColumn !== null && goalColumn !== undefined ? goalColumn : 33554431) << 5 | (bidiLevel == null ? 3 : Math.min(2, bidiLevel));
    return head < anchor ? SelectionRange.create(head, anchor, 16 | 8 | flags) : SelectionRange.create(anchor, head, (head > anchor ? 4 : 0) | flags);
  }
  static normalized(ranges, mainIndex = 0) {
    let main = ranges[mainIndex];
    ranges.sort((a, b) => a.from - b.from);
    mainIndex = ranges.indexOf(main);
    for (let i = 1;i < ranges.length; i++) {
      let range = ranges[i], prev = ranges[i - 1];
      if (range.empty ? range.from <= prev.to : range.from < prev.to) {
        let from = prev.from, to = Math.max(range.to, prev.to);
        if (i <= mainIndex)
          mainIndex--;
        ranges.splice(--i, 2, range.anchor > range.head ? EditorSelection.range(to, from) : EditorSelection.range(from, to));
      }
    }
    return new EditorSelection(ranges, mainIndex);
  }
}
var nextID = 0;

class Facet {
  constructor(combine, compareInput, compare2, isStatic, enables) {
    this.combine = combine;
    this.compareInput = compareInput;
    this.compare = compare2;
    this.isStatic = isStatic;
    this.id = nextID++;
    this.default = combine([]);
    this.extensions = typeof enables == "function" ? enables(this) : enables;
  }
  static define(config = {}) {
    return new Facet(config.combine || ((a) => a), config.compareInput || ((a, b) => a === b), config.compare || (!config.combine ? sameArray : (a, b) => a === b), !!config.static, config.enables);
  }
  of(value) {
    return new FacetProvider([], this, 0, value);
  }
  compute(deps, get) {
    if (this.isStatic)
      throw new Error("Can't compute a static facet");
    return new FacetProvider(deps, this, 1, get);
  }
  computeN(deps, get) {
    if (this.isStatic)
      throw new Error("Can't compute a static facet");
    return new FacetProvider(deps, this, 2, get);
  }
  from(field, get) {
    if (!get)
      get = (x) => x;
    return this.compute([field], (state) => get(state.field(field)));
  }
}

class FacetProvider {
  constructor(dependencies, facet, type, value) {
    this.dependencies = dependencies;
    this.facet = facet;
    this.type = type;
    this.value = value;
    this.id = nextID++;
  }
  dynamicSlot(addresses) {
    var _a;
    let getter = this.value;
    let compare2 = this.facet.compareInput;
    let id = this.id, idx = addresses[id] >> 1, multi = this.type == 2;
    let depDoc = false, depSel = false, depAddrs = [];
    for (let dep of this.dependencies) {
      if (dep == "doc")
        depDoc = true;
      else if (dep == "selection")
        depSel = true;
      else if ((((_a = addresses[dep.id]) !== null && _a !== undefined ? _a : 1) & 1) == 0)
        depAddrs.push(addresses[dep.id]);
    }
    return {
      create(state) {
        state.values[idx] = getter(state);
        return 1;
      },
      update(state, tr) {
        if (depDoc && tr.docChanged || depSel && (tr.docChanged || tr.selection) || ensureAll(state, depAddrs)) {
          let newVal = getter(state);
          if (multi ? !compareArray(newVal, state.values[idx], compare2) : !compare2(newVal, state.values[idx])) {
            state.values[idx] = newVal;
            return 1;
          }
        }
        return 0;
      },
      reconfigure: (state, oldState) => {
        let newVal, oldAddr = oldState.config.address[id];
        if (oldAddr != null) {
          let oldVal = getAddr(oldState, oldAddr);
          if (this.dependencies.every((dep) => {
            return dep instanceof Facet ? oldState.facet(dep) === state.facet(dep) : dep instanceof StateField ? oldState.field(dep, false) == state.field(dep, false) : true;
          }) || (multi ? compareArray(newVal = getter(state), oldVal, compare2) : compare2(newVal = getter(state), oldVal))) {
            state.values[idx] = oldVal;
            return 0;
          }
        } else {
          newVal = getter(state);
        }
        state.values[idx] = newVal;
        return 1;
      }
    };
  }
}
var initField = Facet.define({ static: true });

class StateField {
  constructor(id, createF, updateF, compareF, spec) {
    this.id = id;
    this.createF = createF;
    this.updateF = updateF;
    this.compareF = compareF;
    this.spec = spec;
    this.provides = undefined;
  }
  static define(config) {
    let field = new StateField(nextID++, config.create, config.update, config.compare || ((a, b) => a === b), config);
    if (config.provide)
      field.provides = config.provide(field);
    return field;
  }
  create(state) {
    let init = state.facet(initField).find((i) => i.field == this);
    return ((init === null || init === undefined ? undefined : init.create) || this.createF)(state);
  }
  slot(addresses) {
    let idx = addresses[this.id] >> 1;
    return {
      create: (state) => {
        state.values[idx] = this.create(state);
        return 1;
      },
      update: (state, tr) => {
        let oldVal = state.values[idx];
        let value = this.updateF(oldVal, tr);
        if (this.compareF(oldVal, value))
          return 0;
        state.values[idx] = value;
        return 1;
      },
      reconfigure: (state, oldState) => {
        if (oldState.config.address[this.id] != null) {
          state.values[idx] = oldState.field(this);
          return 0;
        }
        state.values[idx] = this.create(state);
        return 1;
      }
    };
  }
  init(create) {
    return [this, initField.of({ field: this, create })];
  }
  get extension() {
    return this;
  }
}
var Prec_ = { lowest: 4, low: 3, default: 2, high: 1, highest: 0 };
var Prec = {
  highest: prec(Prec_.highest),
  high: prec(Prec_.high),
  default: prec(Prec_.default),
  low: prec(Prec_.low),
  lowest: prec(Prec_.lowest)
};

class PrecExtension {
  constructor(inner, prec2) {
    this.inner = inner;
    this.prec = prec2;
  }
}

class Compartment {
  of(ext) {
    return new CompartmentInstance(this, ext);
  }
  reconfigure(content) {
    return Compartment.reconfigure.of({ compartment: this, extension: content });
  }
  get(state) {
    return state.config.compartments.get(this);
  }
}

class CompartmentInstance {
  constructor(compartment, inner) {
    this.compartment = compartment;
    this.inner = inner;
  }
}

class Configuration {
  constructor(base, compartments, dynamicSlots, address, staticValues, facets) {
    this.base = base;
    this.compartments = compartments;
    this.dynamicSlots = dynamicSlots;
    this.address = address;
    this.staticValues = staticValues;
    this.facets = facets;
    this.statusTemplate = [];
    while (this.statusTemplate.length < dynamicSlots.length)
      this.statusTemplate.push(0);
  }
  staticFacet(facet) {
    let addr = this.address[facet.id];
    return addr == null ? facet.default : this.staticValues[addr >> 1];
  }
  static resolve(base, compartments, oldState) {
    let fields = [];
    let facets = Object.create(null);
    let newCompartments = new Map;
    for (let ext of flatten(base, compartments, newCompartments)) {
      if (ext instanceof StateField)
        fields.push(ext);
      else
        (facets[ext.facet.id] || (facets[ext.facet.id] = [])).push(ext);
    }
    let address = Object.create(null);
    let staticValues = [];
    let dynamicSlots = [];
    for (let field of fields) {
      address[field.id] = dynamicSlots.length << 1;
      dynamicSlots.push((a) => field.slot(a));
    }
    let oldFacets = oldState === null || oldState === undefined ? undefined : oldState.config.facets;
    for (let id in facets) {
      let providers = facets[id], facet = providers[0].facet;
      let oldProviders = oldFacets && oldFacets[id] || [];
      if (providers.every((p) => p.type == 0)) {
        address[facet.id] = staticValues.length << 1 | 1;
        if (sameArray(oldProviders, providers)) {
          staticValues.push(oldState.facet(facet));
        } else {
          let value = facet.combine(providers.map((p) => p.value));
          staticValues.push(oldState && facet.compare(value, oldState.facet(facet)) ? oldState.facet(facet) : value);
        }
      } else {
        for (let p of providers) {
          if (p.type == 0) {
            address[p.id] = staticValues.length << 1 | 1;
            staticValues.push(p.value);
          } else {
            address[p.id] = dynamicSlots.length << 1;
            dynamicSlots.push((a) => p.dynamicSlot(a));
          }
        }
        address[facet.id] = dynamicSlots.length << 1;
        dynamicSlots.push((a) => dynamicFacetSlot(a, facet, providers));
      }
    }
    let dynamic = dynamicSlots.map((f) => f(address));
    return new Configuration(base, newCompartments, dynamic, address, staticValues, facets);
  }
}
var languageData = Facet.define();
var allowMultipleSelections = Facet.define({
  combine: (values) => values.some((v) => v),
  static: true
});
var lineSeparator = Facet.define({
  combine: (values) => values.length ? values[0] : undefined,
  static: true
});
var changeFilter = Facet.define();
var transactionFilter = Facet.define();
var transactionExtender = Facet.define();
var readOnly = Facet.define({
  combine: (values) => values.length ? values[0] : false
});

class Annotation {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
  static define() {
    return new AnnotationType;
  }
}

class AnnotationType {
  of(value) {
    return new Annotation(this, value);
  }
}

class StateEffectType {
  constructor(map) {
    this.map = map;
  }
  of(value) {
    return new StateEffect(this, value);
  }
}

class StateEffect {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
  map(mapping) {
    let mapped = this.type.map(this.value, mapping);
    return mapped === undefined ? undefined : mapped == this.value ? this : new StateEffect(this.type, mapped);
  }
  is(type) {
    return this.type == type;
  }
  static define(spec = {}) {
    return new StateEffectType(spec.map || ((v) => v));
  }
  static mapEffects(effects, mapping) {
    if (!effects.length)
      return effects;
    let result = [];
    for (let effect of effects) {
      let mapped = effect.map(mapping);
      if (mapped)
        result.push(mapped);
    }
    return result;
  }
}
StateEffect.reconfigure = StateEffect.define();
StateEffect.appendConfig = StateEffect.define();

class Transaction {
  constructor(startState, changes, selection, effects, annotations, scrollIntoView) {
    this.startState = startState;
    this.changes = changes;
    this.selection = selection;
    this.effects = effects;
    this.annotations = annotations;
    this.scrollIntoView = scrollIntoView;
    this._doc = null;
    this._state = null;
    if (selection)
      checkSelection(selection, changes.newLength);
    if (!annotations.some((a) => a.type == Transaction.time))
      this.annotations = annotations.concat(Transaction.time.of(Date.now()));
  }
  static create(startState, changes, selection, effects, annotations, scrollIntoView) {
    return new Transaction(startState, changes, selection, effects, annotations, scrollIntoView);
  }
  get newDoc() {
    return this._doc || (this._doc = this.changes.apply(this.startState.doc));
  }
  get newSelection() {
    return this.selection || this.startState.selection.map(this.changes);
  }
  get state() {
    if (!this._state)
      this.startState.applyTransaction(this);
    return this._state;
  }
  annotation(type) {
    for (let ann of this.annotations)
      if (ann.type == type)
        return ann.value;
    return;
  }
  get docChanged() {
    return !this.changes.empty;
  }
  get reconfigured() {
    return this.startState.config != this.state.config;
  }
  isUserEvent(event) {
    let e = this.annotation(Transaction.userEvent);
    return !!(e && (e == event || e.length > event.length && e.slice(0, event.length) == event && e[event.length] == "."));
  }
}
Transaction.time = Annotation.define();
Transaction.userEvent = Annotation.define();
Transaction.addToHistory = Annotation.define();
Transaction.remote = Annotation.define();
var none = [];
var CharCategory = function(CharCategory2) {
  CharCategory2[CharCategory2["Word"] = 0] = "Word";
  CharCategory2[CharCategory2["Space"] = 1] = "Space";
  CharCategory2[CharCategory2["Other"] = 2] = "Other";
  return CharCategory2;
}(CharCategory || (CharCategory = {}));
var nonASCIISingleCaseWordChar = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;
var wordChar;
try {
  wordChar = new RegExp("[\\p{Alphabetic}\\p{Number}_]", "u");
} catch (_) {
}

class EditorState {
  constructor(config, doc, selection, values, computeSlot, tr) {
    this.config = config;
    this.doc = doc;
    this.selection = selection;
    this.values = values;
    this.status = config.statusTemplate.slice();
    this.computeSlot = computeSlot;
    if (tr)
      tr._state = this;
    for (let i = 0;i < this.config.dynamicSlots.length; i++)
      ensureAddr(this, i << 1);
    this.computeSlot = null;
  }
  field(field, require2 = true) {
    let addr = this.config.address[field.id];
    if (addr == null) {
      if (require2)
        throw new RangeError("Field is not present in this state");
      return;
    }
    ensureAddr(this, addr);
    return getAddr(this, addr);
  }
  update(...specs) {
    return resolveTransaction(this, specs, true);
  }
  applyTransaction(tr) {
    let conf = this.config, { base, compartments } = conf;
    for (let effect of tr.effects) {
      if (effect.is(Compartment.reconfigure)) {
        if (conf) {
          compartments = new Map;
          conf.compartments.forEach((val, key) => compartments.set(key, val));
          conf = null;
        }
        compartments.set(effect.value.compartment, effect.value.extension);
      } else if (effect.is(StateEffect.reconfigure)) {
        conf = null;
        base = effect.value;
      } else if (effect.is(StateEffect.appendConfig)) {
        conf = null;
        base = asArray(base).concat(effect.value);
      }
    }
    let startValues;
    if (!conf) {
      conf = Configuration.resolve(base, compartments, this);
      let intermediateState = new EditorState(conf, this.doc, this.selection, conf.dynamicSlots.map(() => null), (state, slot) => slot.reconfigure(state, this), null);
      startValues = intermediateState.values;
    } else {
      startValues = tr.startState.values.slice();
    }
    new EditorState(conf, tr.newDoc, tr.newSelection, startValues, (state, slot) => slot.update(state, tr), tr);
  }
  replaceSelection(text) {
    if (typeof text == "string")
      text = this.toText(text);
    return this.changeByRange((range) => ({
      changes: { from: range.from, to: range.to, insert: text },
      range: EditorSelection.cursor(range.from + text.length)
    }));
  }
  changeByRange(f) {
    let sel = this.selection;
    let result1 = f(sel.ranges[0]);
    let changes = this.changes(result1.changes), ranges = [result1.range];
    let effects = asArray(result1.effects);
    for (let i = 1;i < sel.ranges.length; i++) {
      let result = f(sel.ranges[i]);
      let newChanges = this.changes(result.changes), newMapped = newChanges.map(changes);
      for (let j = 0;j < i; j++)
        ranges[j] = ranges[j].map(newMapped);
      let mapBy = changes.mapDesc(newChanges, true);
      ranges.push(result.range.map(mapBy));
      changes = changes.compose(newMapped);
      effects = StateEffect.mapEffects(effects, newMapped).concat(StateEffect.mapEffects(asArray(result.effects), mapBy));
    }
    return {
      changes,
      selection: EditorSelection.create(ranges, sel.mainIndex),
      effects
    };
  }
  changes(spec = []) {
    if (spec instanceof ChangeSet)
      return spec;
    return ChangeSet.of(spec, this.doc.length, this.facet(EditorState.lineSeparator));
  }
  toText(string) {
    return Text.of(string.split(this.facet(EditorState.lineSeparator) || DefaultSplit));
  }
  sliceDoc(from = 0, to = this.doc.length) {
    return this.doc.sliceString(from, to, this.lineBreak);
  }
  facet(facet) {
    let addr = this.config.address[facet.id];
    if (addr == null)
      return facet.default;
    ensureAddr(this, addr);
    return getAddr(this, addr);
  }
  toJSON(fields) {
    let result = {
      doc: this.sliceDoc(),
      selection: this.selection.toJSON()
    };
    if (fields)
      for (let prop in fields) {
        let value = fields[prop];
        if (value instanceof StateField && this.config.address[value.id] != null)
          result[prop] = value.spec.toJSON(this.field(fields[prop]), this);
      }
    return result;
  }
  static fromJSON(json, config = {}, fields) {
    if (!json || typeof json.doc != "string")
      throw new RangeError("Invalid JSON representation for EditorState");
    let fieldInit = [];
    if (fields)
      for (let prop in fields) {
        if (Object.prototype.hasOwnProperty.call(json, prop)) {
          let field = fields[prop], value = json[prop];
          fieldInit.push(field.init((state) => field.spec.fromJSON(value, state)));
        }
      }
    return EditorState.create({
      doc: json.doc,
      selection: EditorSelection.fromJSON(json.selection),
      extensions: config.extensions ? fieldInit.concat([config.extensions]) : fieldInit
    });
  }
  static create(config = {}) {
    let configuration = Configuration.resolve(config.extensions || [], new Map);
    let doc = config.doc instanceof Text ? config.doc : Text.of((config.doc || "").split(configuration.staticFacet(EditorState.lineSeparator) || DefaultSplit));
    let selection = !config.selection ? EditorSelection.single(0) : config.selection instanceof EditorSelection ? config.selection : EditorSelection.single(config.selection.anchor, config.selection.head);
    checkSelection(selection, doc.length);
    if (!configuration.staticFacet(allowMultipleSelections))
      selection = selection.asSingle();
    return new EditorState(configuration, doc, selection, configuration.dynamicSlots.map(() => null), (state, slot) => slot.create(state), null);
  }
  get tabSize() {
    return this.facet(EditorState.tabSize);
  }
  get lineBreak() {
    return this.facet(EditorState.lineSeparator) || "\n";
  }
  get readOnly() {
    return this.facet(readOnly);
  }
  phrase(phrase, ...insert2) {
    for (let map of this.facet(EditorState.phrases))
      if (Object.prototype.hasOwnProperty.call(map, phrase)) {
        phrase = map[phrase];
        break;
      }
    if (insert2.length)
      phrase = phrase.replace(/\$(\$|\d*)/g, (m, i) => {
        if (i == "$")
          return "$";
        let n = +(i || 1);
        return !n || n > insert2.length ? m : insert2[n - 1];
      });
    return phrase;
  }
  languageDataAt(name, pos, side = -1) {
    let values = [];
    for (let provider of this.facet(languageData)) {
      for (let result of provider(this, pos, side)) {
        if (Object.prototype.hasOwnProperty.call(result, name))
          values.push(result[name]);
      }
    }
    return values;
  }
  charCategorizer(at) {
    return makeCategorizer(this.languageDataAt("wordChars", at).join(""));
  }
  wordAt(pos) {
    let { text, from, length } = this.doc.lineAt(pos);
    let cat = this.charCategorizer(pos);
    let start = pos - from, end = pos - from;
    while (start > 0) {
      let prev = findClusterBreak(text, start, false);
      if (cat(text.slice(prev, start)) != CharCategory.Word)
        break;
      start = prev;
    }
    while (end < length) {
      let next = findClusterBreak(text, end);
      if (cat(text.slice(end, next)) != CharCategory.Word)
        break;
      end = next;
    }
    return start == end ? null : EditorSelection.range(start + from, end + from);
  }
}
EditorState.allowMultipleSelections = allowMultipleSelections;
EditorState.tabSize = Facet.define({
  combine: (values) => values.length ? values[0] : 4
});
EditorState.lineSeparator = lineSeparator;
EditorState.readOnly = readOnly;
EditorState.phrases = Facet.define({
  compare(a, b) {
    let kA = Object.keys(a), kB = Object.keys(b);
    return kA.length == kB.length && kA.every((k) => a[k] == b[k]);
  }
});
EditorState.languageData = languageData;
EditorState.changeFilter = changeFilter;
EditorState.transactionFilter = transactionFilter;
EditorState.transactionExtender = transactionExtender;
Compartment.reconfigure = StateEffect.define();

class RangeValue {
  eq(other) {
    return this == other;
  }
  range(from, to = from) {
    return Range.create(from, to, this);
  }
}
RangeValue.prototype.startSide = RangeValue.prototype.endSide = 0;
RangeValue.prototype.point = false;
RangeValue.prototype.mapMode = MapMode.TrackDel;

class Range {
  constructor(from, to, value) {
    this.from = from;
    this.to = to;
    this.value = value;
  }
  static create(from, to, value) {
    return new Range(from, to, value);
  }
}

class Chunk {
  constructor(from, to, value, maxPoint) {
    this.from = from;
    this.to = to;
    this.value = value;
    this.maxPoint = maxPoint;
  }
  get length() {
    return this.to[this.to.length - 1];
  }
  findIndex(pos, side, end, startAt = 0) {
    let arr = end ? this.to : this.from;
    for (let lo = startAt, hi = arr.length;; ) {
      if (lo == hi)
        return lo;
      let mid = lo + hi >> 1;
      let diff = arr[mid] - pos || (end ? this.value[mid].endSide : this.value[mid].startSide) - side;
      if (mid == lo)
        return diff >= 0 ? lo : hi;
      if (diff >= 0)
        hi = mid;
      else
        lo = mid + 1;
    }
  }
  between(offset, from, to, f) {
    for (let i = this.findIndex(from, -1e9, true), e = this.findIndex(to, 1e9, false, i);i < e; i++)
      if (f(this.from[i] + offset, this.to[i] + offset, this.value[i]) === false)
        return false;
  }
  map(offset, changes) {
    let value = [], from = [], to = [], newPos = -1, maxPoint = -1;
    for (let i = 0;i < this.value.length; i++) {
      let val = this.value[i], curFrom = this.from[i] + offset, curTo = this.to[i] + offset, newFrom, newTo;
      if (curFrom == curTo) {
        let mapped = changes.mapPos(curFrom, val.startSide, val.mapMode);
        if (mapped == null)
          continue;
        newFrom = newTo = mapped;
        if (val.startSide != val.endSide) {
          newTo = changes.mapPos(curFrom, val.endSide);
          if (newTo < newFrom)
            continue;
        }
      } else {
        newFrom = changes.mapPos(curFrom, val.startSide);
        newTo = changes.mapPos(curTo, val.endSide);
        if (newFrom > newTo || newFrom == newTo && val.startSide > 0 && val.endSide <= 0)
          continue;
      }
      if ((newTo - newFrom || val.endSide - val.startSide) < 0)
        continue;
      if (newPos < 0)
        newPos = newFrom;
      if (val.point)
        maxPoint = Math.max(maxPoint, newTo - newFrom);
      value.push(val);
      from.push(newFrom - newPos);
      to.push(newTo - newPos);
    }
    return { mapped: value.length ? new Chunk(from, to, value, maxPoint) : null, pos: newPos };
  }
}

class RangeSet {
  constructor(chunkPos, chunk, nextLayer, maxPoint) {
    this.chunkPos = chunkPos;
    this.chunk = chunk;
    this.nextLayer = nextLayer;
    this.maxPoint = maxPoint;
  }
  static create(chunkPos, chunk, nextLayer, maxPoint) {
    return new RangeSet(chunkPos, chunk, nextLayer, maxPoint);
  }
  get length() {
    let last = this.chunk.length - 1;
    return last < 0 ? 0 : Math.max(this.chunkEnd(last), this.nextLayer.length);
  }
  get size() {
    if (this.isEmpty)
      return 0;
    let size = this.nextLayer.size;
    for (let chunk of this.chunk)
      size += chunk.value.length;
    return size;
  }
  chunkEnd(index) {
    return this.chunkPos[index] + this.chunk[index].length;
  }
  update(updateSpec) {
    let { add = [], sort = false, filterFrom = 0, filterTo = this.length } = updateSpec;
    let filter = updateSpec.filter;
    if (add.length == 0 && !filter)
      return this;
    if (sort)
      add = add.slice().sort(cmpRange);
    if (this.isEmpty)
      return add.length ? RangeSet.of(add) : this;
    let cur = new LayerCursor(this, null, -1).goto(0), i = 0, spill = [];
    let builder = new RangeSetBuilder;
    while (cur.value || i < add.length) {
      if (i < add.length && (cur.from - add[i].from || cur.startSide - add[i].value.startSide) >= 0) {
        let range = add[i++];
        if (!builder.addInner(range.from, range.to, range.value))
          spill.push(range);
      } else if (cur.rangeIndex == 1 && cur.chunkIndex < this.chunk.length && (i == add.length || this.chunkEnd(cur.chunkIndex) < add[i].from) && (!filter || filterFrom > this.chunkEnd(cur.chunkIndex) || filterTo < this.chunkPos[cur.chunkIndex]) && builder.addChunk(this.chunkPos[cur.chunkIndex], this.chunk[cur.chunkIndex])) {
        cur.nextChunk();
      } else {
        if (!filter || filterFrom > cur.to || filterTo < cur.from || filter(cur.from, cur.to, cur.value)) {
          if (!builder.addInner(cur.from, cur.to, cur.value))
            spill.push(Range.create(cur.from, cur.to, cur.value));
        }
        cur.next();
      }
    }
    return builder.finishInner(this.nextLayer.isEmpty && !spill.length ? RangeSet.empty : this.nextLayer.update({ add: spill, filter, filterFrom, filterTo }));
  }
  map(changes) {
    if (changes.empty || this.isEmpty)
      return this;
    let chunks = [], chunkPos = [], maxPoint = -1;
    for (let i = 0;i < this.chunk.length; i++) {
      let start = this.chunkPos[i], chunk = this.chunk[i];
      let touch = changes.touchesRange(start, start + chunk.length);
      if (touch === false) {
        maxPoint = Math.max(maxPoint, chunk.maxPoint);
        chunks.push(chunk);
        chunkPos.push(changes.mapPos(start));
      } else if (touch === true) {
        let { mapped, pos } = chunk.map(start, changes);
        if (mapped) {
          maxPoint = Math.max(maxPoint, mapped.maxPoint);
          chunks.push(mapped);
          chunkPos.push(pos);
        }
      }
    }
    let next = this.nextLayer.map(changes);
    return chunks.length == 0 ? next : new RangeSet(chunkPos, chunks, next || RangeSet.empty, maxPoint);
  }
  between(from, to, f) {
    if (this.isEmpty)
      return;
    for (let i = 0;i < this.chunk.length; i++) {
      let start = this.chunkPos[i], chunk = this.chunk[i];
      if (to >= start && from <= start + chunk.length && chunk.between(start, from - start, to - start, f) === false)
        return;
    }
    this.nextLayer.between(from, to, f);
  }
  iter(from = 0) {
    return HeapCursor.from([this]).goto(from);
  }
  get isEmpty() {
    return this.nextLayer == this;
  }
  static iter(sets, from = 0) {
    return HeapCursor.from(sets).goto(from);
  }
  static compare(oldSets, newSets, textDiff, comparator, minPointSize = -1) {
    let a = oldSets.filter((set) => set.maxPoint > 0 || !set.isEmpty && set.maxPoint >= minPointSize);
    let b = newSets.filter((set) => set.maxPoint > 0 || !set.isEmpty && set.maxPoint >= minPointSize);
    let sharedChunks = findSharedChunks(a, b, textDiff);
    let sideA = new SpanCursor(a, sharedChunks, minPointSize);
    let sideB = new SpanCursor(b, sharedChunks, minPointSize);
    textDiff.iterGaps((fromA, fromB, length) => compare(sideA, fromA, sideB, fromB, length, comparator));
    if (textDiff.empty && textDiff.length == 0)
      compare(sideA, 0, sideB, 0, 0, comparator);
  }
  static eq(oldSets, newSets, from = 0, to) {
    if (to == null)
      to = 1e9 - 1;
    let a = oldSets.filter((set) => !set.isEmpty && newSets.indexOf(set) < 0);
    let b = newSets.filter((set) => !set.isEmpty && oldSets.indexOf(set) < 0);
    if (a.length != b.length)
      return false;
    if (!a.length)
      return true;
    let sharedChunks = findSharedChunks(a, b);
    let sideA = new SpanCursor(a, sharedChunks, 0).goto(from), sideB = new SpanCursor(b, sharedChunks, 0).goto(from);
    for (;; ) {
      if (sideA.to != sideB.to || !sameValues(sideA.active, sideB.active) || sideA.point && (!sideB.point || !sideA.point.eq(sideB.point)))
        return false;
      if (sideA.to > to)
        return true;
      sideA.next();
      sideB.next();
    }
  }
  static spans(sets, from, to, iterator, minPointSize = -1) {
    let cursor = new SpanCursor(sets, null, minPointSize).goto(from), pos = from;
    let openRanges = cursor.openStart;
    for (;; ) {
      let curTo = Math.min(cursor.to, to);
      if (cursor.point) {
        let active = cursor.activeForPoint(cursor.to);
        let openCount = cursor.pointFrom < from ? active.length + 1 : Math.min(active.length, openRanges);
        iterator.point(pos, curTo, cursor.point, active, openCount, cursor.pointRank);
        openRanges = Math.min(cursor.openEnd(curTo), active.length);
      } else if (curTo > pos) {
        iterator.span(pos, curTo, cursor.active, openRanges);
        openRanges = cursor.openEnd(curTo);
      }
      if (cursor.to > to)
        return openRanges + (cursor.point && cursor.to > to ? 1 : 0);
      pos = cursor.to;
      cursor.next();
    }
  }
  static of(ranges, sort = false) {
    let build = new RangeSetBuilder;
    for (let range of ranges instanceof Range ? [ranges] : sort ? lazySort(ranges) : ranges)
      build.add(range.from, range.to, range.value);
    return build.finish();
  }
}
RangeSet.empty = new RangeSet([], [], null, -1);
RangeSet.empty.nextLayer = RangeSet.empty;

class RangeSetBuilder {
  finishChunk(newArrays) {
    this.chunks.push(new Chunk(this.from, this.to, this.value, this.maxPoint));
    this.chunkPos.push(this.chunkStart);
    this.chunkStart = -1;
    this.setMaxPoint = Math.max(this.setMaxPoint, this.maxPoint);
    this.maxPoint = -1;
    if (newArrays) {
      this.from = [];
      this.to = [];
      this.value = [];
    }
  }
  constructor() {
    this.chunks = [];
    this.chunkPos = [];
    this.chunkStart = -1;
    this.last = null;
    this.lastFrom = -1e9;
    this.lastTo = -1e9;
    this.from = [];
    this.to = [];
    this.value = [];
    this.maxPoint = -1;
    this.setMaxPoint = -1;
    this.nextLayer = null;
  }
  add(from, to, value) {
    if (!this.addInner(from, to, value))
      (this.nextLayer || (this.nextLayer = new RangeSetBuilder)).add(from, to, value);
  }
  addInner(from, to, value) {
    let diff = from - this.lastTo || value.startSide - this.last.endSide;
    if (diff <= 0 && (from - this.lastFrom || value.startSide - this.last.startSide) < 0)
      throw new Error("Ranges must be added sorted by `from` position and `startSide`");
    if (diff < 0)
      return false;
    if (this.from.length == 250)
      this.finishChunk(true);
    if (this.chunkStart < 0)
      this.chunkStart = from;
    this.from.push(from - this.chunkStart);
    this.to.push(to - this.chunkStart);
    this.last = value;
    this.lastFrom = from;
    this.lastTo = to;
    this.value.push(value);
    if (value.point)
      this.maxPoint = Math.max(this.maxPoint, to - from);
    return true;
  }
  addChunk(from, chunk) {
    if ((from - this.lastTo || chunk.value[0].startSide - this.last.endSide) < 0)
      return false;
    if (this.from.length)
      this.finishChunk(true);
    this.setMaxPoint = Math.max(this.setMaxPoint, chunk.maxPoint);
    this.chunks.push(chunk);
    this.chunkPos.push(from);
    let last = chunk.value.length - 1;
    this.last = chunk.value[last];
    this.lastFrom = chunk.from[last] + from;
    this.lastTo = chunk.to[last] + from;
    return true;
  }
  finish() {
    return this.finishInner(RangeSet.empty);
  }
  finishInner(next) {
    if (this.from.length)
      this.finishChunk(false);
    if (this.chunks.length == 0)
      return next;
    let result = RangeSet.create(this.chunkPos, this.chunks, this.nextLayer ? this.nextLayer.finishInner(next) : next, this.setMaxPoint);
    this.from = null;
    return result;
  }
}

class LayerCursor {
  constructor(layer, skip, minPoint, rank = 0) {
    this.layer = layer;
    this.skip = skip;
    this.minPoint = minPoint;
    this.rank = rank;
  }
  get startSide() {
    return this.value ? this.value.startSide : 0;
  }
  get endSide() {
    return this.value ? this.value.endSide : 0;
  }
  goto(pos, side = -1e9) {
    this.chunkIndex = this.rangeIndex = 0;
    this.gotoInner(pos, side, false);
    return this;
  }
  gotoInner(pos, side, forward) {
    while (this.chunkIndex < this.layer.chunk.length) {
      let next = this.layer.chunk[this.chunkIndex];
      if (!(this.skip && this.skip.has(next) || this.layer.chunkEnd(this.chunkIndex) < pos || next.maxPoint < this.minPoint))
        break;
      this.chunkIndex++;
      forward = false;
    }
    if (this.chunkIndex < this.layer.chunk.length) {
      let rangeIndex = this.layer.chunk[this.chunkIndex].findIndex(pos - this.layer.chunkPos[this.chunkIndex], side, true);
      if (!forward || this.rangeIndex < rangeIndex)
        this.setRangeIndex(rangeIndex);
    }
    this.next();
  }
  forward(pos, side) {
    if ((this.to - pos || this.endSide - side) < 0)
      this.gotoInner(pos, side, true);
  }
  next() {
    for (;; ) {
      if (this.chunkIndex == this.layer.chunk.length) {
        this.from = this.to = 1e9;
        this.value = null;
        break;
      } else {
        let chunkPos = this.layer.chunkPos[this.chunkIndex], chunk = this.layer.chunk[this.chunkIndex];
        let from = chunkPos + chunk.from[this.rangeIndex];
        this.from = from;
        this.to = chunkPos + chunk.to[this.rangeIndex];
        this.value = chunk.value[this.rangeIndex];
        this.setRangeIndex(this.rangeIndex + 1);
        if (this.minPoint < 0 || this.value.point && this.to - this.from >= this.minPoint)
          break;
      }
    }
  }
  setRangeIndex(index) {
    if (index == this.layer.chunk[this.chunkIndex].value.length) {
      this.chunkIndex++;
      if (this.skip) {
        while (this.chunkIndex < this.layer.chunk.length && this.skip.has(this.layer.chunk[this.chunkIndex]))
          this.chunkIndex++;
      }
      this.rangeIndex = 0;
    } else {
      this.rangeIndex = index;
    }
  }
  nextChunk() {
    this.chunkIndex++;
    this.rangeIndex = 0;
    this.next();
  }
  compare(other) {
    return this.from - other.from || this.startSide - other.startSide || this.rank - other.rank || this.to - other.to || this.endSide - other.endSide;
  }
}

class HeapCursor {
  constructor(heap) {
    this.heap = heap;
  }
  static from(sets, skip = null, minPoint = -1) {
    let heap = [];
    for (let i = 0;i < sets.length; i++) {
      for (let cur = sets[i];!cur.isEmpty; cur = cur.nextLayer) {
        if (cur.maxPoint >= minPoint)
          heap.push(new LayerCursor(cur, skip, minPoint, i));
      }
    }
    return heap.length == 1 ? heap[0] : new HeapCursor(heap);
  }
  get startSide() {
    return this.value ? this.value.startSide : 0;
  }
  goto(pos, side = -1e9) {
    for (let cur of this.heap)
      cur.goto(pos, side);
    for (let i = this.heap.length >> 1;i >= 0; i--)
      heapBubble(this.heap, i);
    this.next();
    return this;
  }
  forward(pos, side) {
    for (let cur of this.heap)
      cur.forward(pos, side);
    for (let i = this.heap.length >> 1;i >= 0; i--)
      heapBubble(this.heap, i);
    if ((this.to - pos || this.value.endSide - side) < 0)
      this.next();
  }
  next() {
    if (this.heap.length == 0) {
      this.from = this.to = 1e9;
      this.value = null;
      this.rank = -1;
    } else {
      let top = this.heap[0];
      this.from = top.from;
      this.to = top.to;
      this.value = top.value;
      this.rank = top.rank;
      if (top.value)
        top.next();
      heapBubble(this.heap, 0);
    }
  }
}

class SpanCursor {
  constructor(sets, skip, minPoint) {
    this.minPoint = minPoint;
    this.active = [];
    this.activeTo = [];
    this.activeRank = [];
    this.minActive = -1;
    this.point = null;
    this.pointFrom = 0;
    this.pointRank = 0;
    this.to = -1e9;
    this.endSide = 0;
    this.openStart = -1;
    this.cursor = HeapCursor.from(sets, skip, minPoint);
  }
  goto(pos, side = -1e9) {
    this.cursor.goto(pos, side);
    this.active.length = this.activeTo.length = this.activeRank.length = 0;
    this.minActive = -1;
    this.to = pos;
    this.endSide = side;
    this.openStart = -1;
    this.next();
    return this;
  }
  forward(pos, side) {
    while (this.minActive > -1 && (this.activeTo[this.minActive] - pos || this.active[this.minActive].endSide - side) < 0)
      this.removeActive(this.minActive);
    this.cursor.forward(pos, side);
  }
  removeActive(index) {
    remove(this.active, index);
    remove(this.activeTo, index);
    remove(this.activeRank, index);
    this.minActive = findMinIndex(this.active, this.activeTo);
  }
  addActive(trackOpen) {
    let i = 0, { value, to, rank } = this.cursor;
    while (i < this.activeRank.length && this.activeRank[i] <= rank)
      i++;
    insert(this.active, i, value);
    insert(this.activeTo, i, to);
    insert(this.activeRank, i, rank);
    if (trackOpen)
      insert(trackOpen, i, this.cursor.from);
    this.minActive = findMinIndex(this.active, this.activeTo);
  }
  next() {
    let from = this.to, wasPoint = this.point;
    this.point = null;
    let trackOpen = this.openStart < 0 ? [] : null;
    for (;; ) {
      let a = this.minActive;
      if (a > -1 && (this.activeTo[a] - this.cursor.from || this.active[a].endSide - this.cursor.startSide) < 0) {
        if (this.activeTo[a] > from) {
          this.to = this.activeTo[a];
          this.endSide = this.active[a].endSide;
          break;
        }
        this.removeActive(a);
        if (trackOpen)
          remove(trackOpen, a);
      } else if (!this.cursor.value) {
        this.to = this.endSide = 1e9;
        break;
      } else if (this.cursor.from > from) {
        this.to = this.cursor.from;
        this.endSide = this.cursor.startSide;
        break;
      } else {
        let nextVal = this.cursor.value;
        if (!nextVal.point) {
          this.addActive(trackOpen);
          this.cursor.next();
        } else if (wasPoint && this.cursor.to == this.to && this.cursor.from < this.cursor.to) {
          this.cursor.next();
        } else {
          this.point = nextVal;
          this.pointFrom = this.cursor.from;
          this.pointRank = this.cursor.rank;
          this.to = this.cursor.to;
          this.endSide = nextVal.endSide;
          this.cursor.next();
          this.forward(this.to, this.endSide);
          break;
        }
      }
    }
    if (trackOpen) {
      this.openStart = 0;
      for (let i = trackOpen.length - 1;i >= 0 && trackOpen[i] < from; i--)
        this.openStart++;
    }
  }
  activeForPoint(to) {
    if (!this.active.length)
      return this.active;
    let active = [];
    for (let i = this.active.length - 1;i >= 0; i--) {
      if (this.activeRank[i] < this.pointRank)
        break;
      if (this.activeTo[i] > to || this.activeTo[i] == to && this.active[i].endSide >= this.point.endSide)
        active.push(this.active[i]);
    }
    return active.reverse();
  }
  openEnd(to) {
    let open = 0;
    for (let i = this.activeTo.length - 1;i >= 0 && this.activeTo[i] > to; i--)
      open++;
    return open;
  }
}

// /home/ray/Code/diagramatics-site/node_modules/style-mod/src/style-mod.js
var C = "\u037C";
var COUNT = typeof Symbol == "undefined" ? "__" + C : Symbol.for(C);
var SET = typeof Symbol == "undefined" ? "__styleSet" + Math.floor(Math.random() * 1e8) : Symbol("styleSet");
var top = typeof globalThis != "undefined" ? globalThis : typeof window != "undefined" ? window : {};

class StyleModule {
  constructor(spec, options) {
    this.rules = [];
    let { finish } = options || {};
    function splitSelector(selector) {
      return /^@/.test(selector) ? [selector] : selector.split(/,\s*/);
    }
    function render(selectors, spec2, target, isKeyframes) {
      let local = [], isAt = /^@(\w+)\b/.exec(selectors[0]), keyframes = isAt && isAt[1] == "keyframes";
      if (isAt && spec2 == null)
        return target.push(selectors[0] + ";");
      for (let prop in spec2) {
        let value = spec2[prop];
        if (/&/.test(prop)) {
          render(prop.split(/,\s*/).map((part) => selectors.map((sel) => part.replace(/&/, sel))).reduce((a, b) => a.concat(b)), value, target);
        } else if (value && typeof value == "object") {
          if (!isAt)
            throw new RangeError("The value of a property (" + prop + ") should be a primitive value.");
          render(splitSelector(prop), value, local, keyframes);
        } else if (value != null) {
          local.push(prop.replace(/_.*/, "").replace(/[A-Z]/g, (l) => "-" + l.toLowerCase()) + ": " + value + ";");
        }
      }
      if (local.length || keyframes) {
        target.push((finish && !isAt && !isKeyframes ? selectors.map(finish) : selectors).join(", ") + " {" + local.join(" ") + "}");
      }
    }
    for (let prop in spec)
      render(splitSelector(prop), spec[prop], this.rules);
  }
  getRules() {
    return this.rules.join("\n");
  }
  static newName() {
    let id = top[COUNT] || 1;
    top[COUNT] = id + 1;
    return C + id.toString(36);
  }
  static mount(root, modules, options) {
    let set = root[SET], nonce = options && options.nonce;
    if (!set)
      set = new StyleSet(root, nonce);
    else if (nonce)
      set.setNonce(nonce);
    set.mount(Array.isArray(modules) ? modules : [modules]);
  }
}
var adoptedSet = new Map;

class StyleSet {
  constructor(root, nonce) {
    let doc = root.ownerDocument || root, win = doc.defaultView;
    if (!root.head && root.adoptedStyleSheets && win.CSSStyleSheet) {
      let adopted = adoptedSet.get(doc);
      if (adopted) {
        root.adoptedStyleSheets = [adopted.sheet, ...root.adoptedStyleSheets];
        return root[SET] = adopted;
      }
      this.sheet = new win.CSSStyleSheet;
      root.adoptedStyleSheets = [this.sheet, ...root.adoptedStyleSheets];
      adoptedSet.set(doc, this);
    } else {
      this.styleTag = doc.createElement("style");
      if (nonce)
        this.styleTag.setAttribute("nonce", nonce);
      let target = root.head || root;
      target.insertBefore(this.styleTag, target.firstChild);
    }
    this.modules = [];
    root[SET] = this;
  }
  mount(modules) {
    let sheet = this.sheet;
    let pos = 0, j = 0;
    for (let i = 0;i < modules.length; i++) {
      let mod = modules[i], index = this.modules.indexOf(mod);
      if (index < j && index > -1) {
        this.modules.splice(index, 1);
        j--;
        index = -1;
      }
      if (index == -1) {
        this.modules.splice(j++, 0, mod);
        if (sheet)
          for (let k = 0;k < mod.rules.length; k++)
            sheet.insertRule(mod.rules[k], pos++);
      } else {
        while (j < index)
          pos += this.modules[j++].rules.length;
        pos += mod.rules.length;
        j++;
      }
    }
    if (!sheet) {
      let text = "";
      for (let i = 0;i < this.modules.length; i++)
        text += this.modules[i].getRules() + "\n";
      this.styleTag.textContent = text;
    }
  }
  setNonce(nonce) {
    if (this.styleTag && this.styleTag.getAttribute("nonce") != nonce)
      this.styleTag.setAttribute("nonce", nonce);
  }
}

// /home/ray/Code/diagramatics-site/node_modules/w3c-keyname/index.js
function keyName(event) {
  var ignoreKey = mac && event.metaKey && event.shiftKey && !event.ctrlKey && !event.altKey || ie && event.shiftKey && event.key && event.key.length == 1 || event.key == "Unidentified";
  var name = !ignoreKey && event.key || (event.shiftKey ? shift : base)[event.keyCode] || event.key || "Unidentified";
  if (name == "Esc")
    name = "Escape";
  if (name == "Del")
    name = "Delete";
  if (name == "Left")
    name = "ArrowLeft";
  if (name == "Up")
    name = "ArrowUp";
  if (name == "Right")
    name = "ArrowRight";
  if (name == "Down")
    name = "ArrowDown";
  return name;
}
var base = {
  8: "Backspace",
  9: "Tab",
  10: "Enter",
  12: "NumLock",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  44: "PrintScreen",
  45: "Insert",
  46: "Delete",
  59: ";",
  61: "=",
  91: "Meta",
  92: "Meta",
  106: "*",
  107: "+",
  108: ",",
  109: "-",
  110: ".",
  111: "/",
  144: "NumLock",
  145: "ScrollLock",
  160: "Shift",
  161: "Shift",
  162: "Control",
  163: "Control",
  164: "Alt",
  165: "Alt",
  173: "-",
  186: ";",
  187: "=",
  188: ",",
  189: "-",
  190: ".",
  191: "/",
  192: "`",
  219: "[",
  220: "\\",
  221: "]",
  222: "'"
};
var shift = {
  48: ")",
  49: "!",
  50: "@",
  51: "#",
  52: "$",
  53: "%",
  54: "^",
  55: "&",
  56: "*",
  57: "(",
  59: ":",
  61: "+",
  173: "_",
  186: ":",
  187: "+",
  188: "<",
  189: "_",
  190: ">",
  191: "?",
  192: "~",
  219: "{",
  220: "|",
  221: "}",
  222: "\""
};
var mac = typeof navigator != "undefined" && /Mac/.test(navigator.platform);
var ie = typeof navigator != "undefined" && /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);
for (i = 0;i < 10; i++)
  base[48 + i] = base[96 + i] = String(i);
var i;
for (i = 1;i <= 24; i++)
  base[i + 111] = "F" + i;
var i;
for (i = 65;i <= 90; i++) {
  base[i] = String.fromCharCode(i + 32);
  shift[i] = String.fromCharCode(i);
}
var i;
for (code in base)
  if (!shift.hasOwnProperty(code))
    shift[code] = base[code];
var code;

// /home/ray/Code/diagramatics-site/node_modules/@codemirror/view/dist/index.js
var getSelection = function(root) {
  let target;
  if (root.nodeType == 11) {
    target = root.getSelection ? root : root.ownerDocument;
  } else {
    target = root;
  }
  return target.getSelection();
};
var contains = function(dom, node) {
  return node ? dom == node || dom.contains(node.nodeType != 1 ? node.parentNode : node) : false;
};
var deepActiveElement = function(doc) {
  let elt = doc.activeElement;
  while (elt && elt.shadowRoot)
    elt = elt.shadowRoot.activeElement;
  return elt;
};
var hasSelection = function(dom, selection) {
  if (!selection.anchorNode)
    return false;
  try {
    return contains(dom, selection.anchorNode);
  } catch (_) {
    return false;
  }
};
var clientRectsFor = function(dom) {
  if (dom.nodeType == 3)
    return textRange(dom, 0, dom.nodeValue.length).getClientRects();
  else if (dom.nodeType == 1)
    return dom.getClientRects();
  else
    return [];
};
var isEquivalentPosition = function(node, off, targetNode, targetOff) {
  return targetNode ? scanFor(node, off, targetNode, targetOff, -1) || scanFor(node, off, targetNode, targetOff, 1) : false;
};
var domIndex = function(node) {
  for (var index = 0;; index++) {
    node = node.previousSibling;
    if (!node)
      return index;
  }
};
var scanFor = function(node, off, targetNode, targetOff, dir) {
  for (;; ) {
    if (node == targetNode && off == targetOff)
      return true;
    if (off == (dir < 0 ? 0 : maxOffset(node))) {
      if (node.nodeName == "DIV")
        return false;
      let parent = node.parentNode;
      if (!parent || parent.nodeType != 1)
        return false;
      off = domIndex(node) + (dir < 0 ? 0 : 1);
      node = parent;
    } else if (node.nodeType == 1) {
      node = node.childNodes[off + (dir < 0 ? -1 : 0)];
      if (node.nodeType == 1 && node.contentEditable == "false")
        return false;
      off = dir < 0 ? maxOffset(node) : 0;
    } else {
      return false;
    }
  }
};
var maxOffset = function(node) {
  return node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length;
};
var flattenRect = function(rect, left) {
  let x = left ? rect.left : rect.right;
  return { left: x, right: x, top: rect.top, bottom: rect.bottom };
};
var windowRect = function(win) {
  return {
    left: 0,
    right: win.innerWidth,
    top: 0,
    bottom: win.innerHeight
  };
};
var scrollRectIntoView = function(dom, rect, side, x, y, xMargin, yMargin, ltr) {
  let doc = dom.ownerDocument, win = doc.defaultView || window;
  for (let cur = dom, stop = false;cur && !stop; ) {
    if (cur.nodeType == 1) {
      let bounding, top2 = cur == doc.body;
      let scaleX = 1, scaleY = 1;
      if (top2) {
        bounding = windowRect(win);
      } else {
        if (/^(fixed|sticky)$/.test(getComputedStyle(cur).position))
          stop = true;
        if (cur.scrollHeight <= cur.clientHeight && cur.scrollWidth <= cur.clientWidth) {
          cur = cur.assignedSlot || cur.parentNode;
          continue;
        }
        let rect2 = cur.getBoundingClientRect();
        scaleX = rect2.width / cur.offsetWidth;
        scaleY = rect2.height / cur.offsetHeight;
        bounding = {
          left: rect2.left,
          right: rect2.left + cur.clientWidth * scaleX,
          top: rect2.top,
          bottom: rect2.top + cur.clientHeight * scaleY
        };
      }
      let moveX = 0, moveY = 0;
      if (y == "nearest") {
        if (rect.top < bounding.top) {
          moveY = -(bounding.top - rect.top + yMargin);
          if (side > 0 && rect.bottom > bounding.bottom + moveY)
            moveY = rect.bottom - bounding.bottom + moveY + yMargin;
        } else if (rect.bottom > bounding.bottom) {
          moveY = rect.bottom - bounding.bottom + yMargin;
          if (side < 0 && rect.top - moveY < bounding.top)
            moveY = -(bounding.top + moveY - rect.top + yMargin);
        }
      } else {
        let rectHeight = rect.bottom - rect.top, boundingHeight = bounding.bottom - bounding.top;
        let targetTop = y == "center" && rectHeight <= boundingHeight ? rect.top + rectHeight / 2 - boundingHeight / 2 : y == "start" || y == "center" && side < 0 ? rect.top - yMargin : rect.bottom - boundingHeight + yMargin;
        moveY = targetTop - bounding.top;
      }
      if (x == "nearest") {
        if (rect.left < bounding.left) {
          moveX = -(bounding.left - rect.left + xMargin);
          if (side > 0 && rect.right > bounding.right + moveX)
            moveX = rect.right - bounding.right + moveX + xMargin;
        } else if (rect.right > bounding.right) {
          moveX = rect.right - bounding.right + xMargin;
          if (side < 0 && rect.left < bounding.left + moveX)
            moveX = -(bounding.left + moveX - rect.left + xMargin);
        }
      } else {
        let targetLeft = x == "center" ? rect.left + (rect.right - rect.left) / 2 - (bounding.right - bounding.left) / 2 : x == "start" == ltr ? rect.left - xMargin : rect.right - (bounding.right - bounding.left) + xMargin;
        moveX = targetLeft - bounding.left;
      }
      if (moveX || moveY) {
        if (top2) {
          win.scrollBy(moveX, moveY);
        } else {
          let movedX = 0, movedY = 0;
          if (moveY) {
            let start = cur.scrollTop;
            cur.scrollTop += moveY / scaleY;
            movedY = (cur.scrollTop - start) * scaleY;
          }
          if (moveX) {
            let start = cur.scrollLeft;
            cur.scrollLeft += moveX / scaleX;
            movedX = (cur.scrollLeft - start) * scaleX;
          }
          rect = {
            left: rect.left - movedX,
            top: rect.top - movedY,
            right: rect.right - movedX,
            bottom: rect.bottom - movedY
          };
          if (movedX && Math.abs(movedX - moveX) < 1)
            x = "nearest";
          if (movedY && Math.abs(movedY - moveY) < 1)
            y = "nearest";
        }
      }
      if (top2)
        break;
      cur = cur.assignedSlot || cur.parentNode;
    } else if (cur.nodeType == 11) {
      cur = cur.host;
    } else {
      break;
    }
  }
};
var scrollableParent = function(dom) {
  let doc = dom.ownerDocument;
  for (let cur = dom.parentNode;cur; ) {
    if (cur == doc.body) {
      break;
    } else if (cur.nodeType == 1) {
      if (cur.scrollHeight > cur.clientHeight || cur.scrollWidth > cur.clientWidth)
        return cur;
      cur = cur.assignedSlot || cur.parentNode;
    } else if (cur.nodeType == 11) {
      cur = cur.host;
    } else {
      break;
    }
  }
  return null;
};
var focusPreventScroll = function(dom) {
  if (dom.setActive)
    return dom.setActive();
  if (preventScrollSupported)
    return dom.focus(preventScrollSupported);
  let stack = [];
  for (let cur = dom;cur; cur = cur.parentNode) {
    stack.push(cur, cur.scrollTop, cur.scrollLeft);
    if (cur == cur.ownerDocument)
      break;
  }
  dom.focus(preventScrollSupported == null ? {
    get preventScroll() {
      preventScrollSupported = { preventScroll: true };
      return true;
    }
  } : undefined);
  if (!preventScrollSupported) {
    preventScrollSupported = false;
    for (let i = 0;i < stack.length; ) {
      let elt = stack[i++], top2 = stack[i++], left = stack[i++];
      if (elt.scrollTop != top2)
        elt.scrollTop = top2;
      if (elt.scrollLeft != left)
        elt.scrollLeft = left;
    }
  }
};
var textRange = function(node, from, to = from) {
  let range = scratchRange || (scratchRange = document.createRange());
  range.setEnd(node, to);
  range.setStart(node, from);
  return range;
};
var dispatchKey = function(elt, name, code) {
  let options = { key: name, code: name, keyCode: code, which: code, cancelable: true };
  let down = new KeyboardEvent("keydown", options);
  down.synthetic = true;
  elt.dispatchEvent(down);
  let up = new KeyboardEvent("keyup", options);
  up.synthetic = true;
  elt.dispatchEvent(up);
  return down.defaultPrevented || up.defaultPrevented;
};
var getRoot = function(node) {
  while (node) {
    if (node && (node.nodeType == 9 || node.nodeType == 11 && node.host))
      return node;
    node = node.assignedSlot || node.parentNode;
  }
  return null;
};
var clearAttributes = function(node) {
  while (node.attributes.length)
    node.removeAttributeNode(node.attributes[0]);
};
var atElementStart = function(doc, selection) {
  let { focusNode: node, focusOffset: offset } = selection;
  if (!node || selection.anchorNode != node || selection.anchorOffset != offset)
    return false;
  offset = Math.min(offset, maxOffset(node));
  for (;; ) {
    if (offset) {
      if (node.nodeType != 1)
        return false;
      let prev = node.childNodes[offset - 1];
      if (prev.contentEditable == "false")
        offset--;
      else {
        node = prev;
        offset = maxOffset(node);
      }
    } else if (node == doc) {
      return true;
    } else {
      offset = domIndex(node);
      node = node.parentNode;
    }
  }
};
var isScrolledToBottom = function(elt) {
  return elt.scrollTop > Math.max(1, elt.scrollHeight - elt.clientHeight - 4);
};
var rm$1 = function(dom) {
  let next = dom.nextSibling;
  dom.parentNode.removeChild(dom);
  return next;
};
var replaceRange = function(parent, fromI, fromOff, toI, toOff, insert2, breakAtStart, openStart, openEnd) {
  let { children } = parent;
  let before = children.length ? children[fromI] : null;
  let last = insert2.length ? insert2[insert2.length - 1] : null;
  let breakAtEnd = last ? last.breakAfter : breakAtStart;
  if (fromI == toI && before && !breakAtStart && !breakAtEnd && insert2.length < 2 && before.merge(fromOff, toOff, insert2.length ? last : null, fromOff == 0, openStart, openEnd))
    return;
  if (toI < children.length) {
    let after = children[toI];
    if (after && toOff < after.length) {
      if (fromI == toI) {
        after = after.split(toOff);
        toOff = 0;
      }
      if (!breakAtEnd && last && after.merge(0, toOff, last, true, 0, openEnd)) {
        insert2[insert2.length - 1] = after;
      } else {
        if (toOff)
          after.merge(0, toOff, null, false, 0, openEnd);
        insert2.push(after);
      }
    } else if (after === null || after === undefined ? undefined : after.breakAfter) {
      if (last)
        last.breakAfter = 1;
      else
        breakAtStart = 1;
    }
    toI++;
  }
  if (before) {
    before.breakAfter = breakAtStart;
    if (fromOff > 0) {
      if (!breakAtStart && insert2.length && before.merge(fromOff, before.length, insert2[0], false, openStart, 0)) {
        before.breakAfter = insert2.shift().breakAfter;
      } else if (fromOff < before.length || before.children.length && before.children[before.children.length - 1].length == 0) {
        before.merge(fromOff, before.length, null, false, openStart, 0);
      }
      fromI++;
    }
  }
  while (fromI < toI && insert2.length) {
    if (children[toI - 1].become(insert2[insert2.length - 1])) {
      toI--;
      insert2.pop();
      openEnd = insert2.length ? 0 : openStart;
    } else if (children[fromI].become(insert2[0])) {
      fromI++;
      insert2.shift();
      openStart = insert2.length ? 0 : openEnd;
    } else {
      break;
    }
  }
  if (!insert2.length && fromI && toI < children.length && !children[fromI - 1].breakAfter && children[toI].merge(0, 0, children[fromI - 1], false, openStart, openEnd))
    fromI--;
  if (fromI < toI || insert2.length)
    parent.replaceChildren(fromI, toI, insert2);
};
var mergeChildrenInto = function(parent, from, to, insert2, openStart, openEnd) {
  let cur = parent.childCursor();
  let { i: toI, off: toOff } = cur.findPos(to, 1);
  let { i: fromI, off: fromOff } = cur.findPos(from, -1);
  let dLen = from - to;
  for (let view of insert2)
    dLen += view.length;
  parent.length += dLen;
  replaceRange(parent, fromI, fromOff, toI, toOff, insert2, 0, openStart, openEnd);
};
var textCoords = function(text, pos, side) {
  let length = text.nodeValue.length;
  if (pos > length)
    pos = length;
  let from = pos, to = pos, flatten2 = 0;
  if (pos == 0 && side < 0 || pos == length && side >= 0) {
    if (!(browser.chrome || browser.gecko)) {
      if (pos) {
        from--;
        flatten2 = 1;
      } else if (to < length) {
        to++;
        flatten2 = -1;
      }
    }
  } else {
    if (side < 0)
      from--;
    else if (to < length)
      to++;
  }
  let rects = textRange(text, from, to).getClientRects();
  if (!rects.length)
    return null;
  let rect = rects[(flatten2 ? flatten2 < 0 : side >= 0) ? 0 : rects.length - 1];
  if (browser.safari && !flatten2 && rect.width == 0)
    rect = Array.prototype.find.call(rects, (r) => r.width) || rect;
  return flatten2 ? flattenRect(rect, flatten2 < 0) : rect || null;
};
var inlineDOMAtPos = function(parent, pos) {
  let dom = parent.dom, { children } = parent, i = 0;
  for (let off = 0;i < children.length; i++) {
    let child = children[i], end = off + child.length;
    if (end == off && child.getSide() <= 0)
      continue;
    if (pos > off && pos < end && child.dom.parentNode == dom)
      return child.domAtPos(pos - off);
    if (pos <= off)
      break;
    off = end;
  }
  for (let j = i;j > 0; j--) {
    let prev = children[j - 1];
    if (prev.dom.parentNode == dom)
      return prev.domAtPos(prev.length);
  }
  for (let j = i;j < children.length; j++) {
    let next = children[j];
    if (next.dom.parentNode == dom)
      return next.domAtPos(0);
  }
  return new DOMPos(dom, 0);
};
var joinInlineInto = function(parent, view, open) {
  let last, { children } = parent;
  if (open > 0 && view instanceof MarkView && children.length && (last = children[children.length - 1]) instanceof MarkView && last.mark.eq(view.mark)) {
    joinInlineInto(last, view.children[0], open - 1);
  } else {
    children.push(view);
    view.setParent(parent);
  }
  parent.length += view.length;
};
var coordsInChildren = function(view, pos, side) {
  let before = null, beforePos = -1, after = null, afterPos = -1;
  function scan(view2, pos2) {
    for (let i = 0, off = 0;i < view2.children.length && off <= pos2; i++) {
      let child = view2.children[i], end = off + child.length;
      if (end >= pos2) {
        if (child.children.length) {
          scan(child, pos2 - off);
        } else if ((!after || after.isHidden && side > 0) && (end > pos2 || off == end && child.getSide() > 0)) {
          after = child;
          afterPos = pos2 - off;
        } else if (off < pos2 || off == end && child.getSide() < 0 && !child.isHidden) {
          before = child;
          beforePos = pos2 - off;
        }
      }
      off = end;
    }
  }
  scan(view, pos);
  let target = (side < 0 ? before : after) || before || after;
  if (target)
    return target.coordsAt(Math.max(0, target == before ? beforePos : afterPos), side);
  return fallbackRect(view);
};
var fallbackRect = function(view) {
  let last = view.dom.lastChild;
  if (!last)
    return view.dom.getBoundingClientRect();
  let rects = clientRectsFor(last);
  return rects[rects.length - 1] || null;
};
var combineAttrs = function(source, target) {
  for (let name in source) {
    if (name == "class" && target.class)
      target.class += " " + source.class;
    else if (name == "style" && target.style)
      target.style += ";" + source.style;
    else
      target[name] = source[name];
  }
  return target;
};
var attrsEq = function(a, b, ignore) {
  if (a == b)
    return true;
  if (!a)
    a = noAttrs;
  if (!b)
    b = noAttrs;
  let keysA = Object.keys(a), keysB = Object.keys(b);
  if (keysA.length - (ignore && keysA.indexOf(ignore) > -1 ? 1 : 0) != keysB.length - (ignore && keysB.indexOf(ignore) > -1 ? 1 : 0))
    return false;
  for (let key of keysA) {
    if (key != ignore && (keysB.indexOf(key) == -1 || a[key] !== b[key]))
      return false;
  }
  return true;
};
var updateAttrs = function(dom, prev, attrs) {
  let changed = false;
  if (prev) {
    for (let name in prev)
      if (!(attrs && (name in attrs))) {
        changed = true;
        if (name == "style")
          dom.style.cssText = "";
        else
          dom.removeAttribute(name);
      }
  }
  if (attrs) {
    for (let name in attrs)
      if (!(prev && prev[name] == attrs[name])) {
        changed = true;
        if (name == "style")
          dom.style.cssText = attrs[name];
        else
          dom.setAttribute(name, attrs[name]);
      }
  }
  return changed;
};
var getAttrs = function(dom) {
  let attrs = Object.create(null);
  for (let i = 0;i < dom.attributes.length; i++) {
    let attr = dom.attributes[i];
    attrs[attr.name] = attr.value;
  }
  return attrs;
};
var getInclusive = function(spec, block = false) {
  let { inclusiveStart: start, inclusiveEnd: end } = spec;
  if (start == null)
    start = spec.inclusive;
  if (end == null)
    end = spec.inclusive;
  return { start: start !== null && start !== undefined ? start : block, end: end !== null && end !== undefined ? end : block };
};
var widgetsEq = function(a, b) {
  return a == b || !!(a && b && a.compare(b));
};
var addRange = function(from, to, ranges, margin = 0) {
  let last = ranges.length - 1;
  if (last >= 0 && ranges[last] + margin >= from)
    ranges[last] = Math.max(ranges[last], to);
  else
    ranges.push(from, to);
};
var wrapMarks = function(view, active) {
  for (let mark of active)
    view = new MarkView(mark, [view], view.length);
  return view;
};
var logException = function(state2, exception, context) {
  let handler = state2.facet(exceptionSink);
  if (handler.length)
    handler[0](exception);
  else if (window.onerror)
    window.onerror(String(exception), context, undefined, undefined, exception);
  else if (context)
    console.error(context + ":", exception);
  else
    console.error(exception);
};
var getIsolatedRanges = function(view, from, to) {
  let isolates = view.state.facet(bidiIsolatedRanges);
  if (!isolates.length)
    return isolates;
  let sets = isolates.map((i) => i instanceof Function ? i(view) : i);
  let result = [];
  RangeSet.spans(sets, from, to, {
    point() {
    },
    span(from2, to2, active, open) {
      let level = result;
      for (let i = active.length - 1;i >= 0; i--, open--) {
        let iso = active[i].spec.bidiIsolate, update;
        if (iso == null)
          continue;
        if (open > 0 && level.length && (update = level[level.length - 1]).to == from2 && update.direction == iso) {
          update.to = to2;
          level = update.inner;
        } else {
          let add = { from: from2, to: to2, direction: iso, inner: [] };
          level.push(add);
          level = add.inner;
        }
      }
    }
  });
  return result;
};
var getScrollMargins = function(view) {
  let left = 0, right = 0, top2 = 0, bottom = 0;
  for (let source of view.state.facet(scrollMargins)) {
    let m = source(view);
    if (m) {
      if (m.left != null)
        left = Math.max(left, m.left);
      if (m.right != null)
        right = Math.max(right, m.right);
      if (m.top != null)
        top2 = Math.max(top2, m.top);
      if (m.bottom != null)
        bottom = Math.max(bottom, m.bottom);
    }
  }
  return { left, right, top: top2, bottom };
};
var dec = function(str) {
  let result = [];
  for (let i = 0;i < str.length; i++)
    result.push(1 << +str[i]);
  return result;
};
var charType = function(ch) {
  return ch <= 247 ? LowTypes[ch] : 1424 <= ch && ch <= 1524 ? 2 : 1536 <= ch && ch <= 1785 ? ArabicTypes[ch - 1536] : 1774 <= ch && ch <= 2220 ? 4 : 8192 <= ch && ch <= 8203 ? 256 : 64336 <= ch && ch <= 65023 ? 4 : ch == 8204 ? 256 : 1;
};
var isolatesEq = function(a, b) {
  if (a.length != b.length)
    return false;
  for (let i = 0;i < a.length; i++) {
    let iA = a[i], iB = b[i];
    if (iA.from != iB.from || iA.to != iB.to || iA.direction != iB.direction || !isolatesEq(iA.inner, iB.inner))
      return false;
  }
  return true;
};
var computeCharTypes = function(line, rFrom, rTo, isolates, outerType) {
  for (let iI = 0;iI <= isolates.length; iI++) {
    let from = iI ? isolates[iI - 1].to : rFrom, to = iI < isolates.length ? isolates[iI].from : rTo;
    let prevType = iI ? 256 : outerType;
    for (let i = from, prev = prevType, prevStrong = prevType;i < to; i++) {
      let type = charType(line.charCodeAt(i));
      if (type == 512)
        type = prev;
      else if (type == 8 && prevStrong == 4)
        type = 16;
      types[i] = type == 4 ? 2 : type;
      if (type & 7)
        prevStrong = type;
      prev = type;
    }
    for (let i = from, prev = prevType, prevStrong = prevType;i < to; i++) {
      let type = types[i];
      if (type == 128) {
        if (i < to - 1 && prev == types[i + 1] && prev & 24)
          type = types[i] = prev;
        else
          types[i] = 256;
      } else if (type == 64) {
        let end = i + 1;
        while (end < to && types[end] == 64)
          end++;
        let replace = i && prev == 8 || end < rTo && types[end] == 8 ? prevStrong == 1 ? 1 : 8 : 256;
        for (let j = i;j < end; j++)
          types[j] = replace;
        i = end - 1;
      } else if (type == 8 && prevStrong == 1) {
        types[i] = 1;
      }
      prev = type;
      if (type & 7)
        prevStrong = type;
    }
  }
};
var processBracketPairs = function(line, rFrom, rTo, isolates, outerType) {
  let oppositeType = outerType == 1 ? 2 : 1;
  for (let iI = 0, sI = 0, context = 0;iI <= isolates.length; iI++) {
    let from = iI ? isolates[iI - 1].to : rFrom, to = iI < isolates.length ? isolates[iI].from : rTo;
    for (let i = from, ch, br, type;i < to; i++) {
      if (br = Brackets[ch = line.charCodeAt(i)]) {
        if (br < 0) {
          for (let sJ = sI - 3;sJ >= 0; sJ -= 3) {
            if (BracketStack[sJ + 1] == -br) {
              let flags = BracketStack[sJ + 2];
              let type2 = flags & 2 ? outerType : !(flags & 4) ? 0 : flags & 1 ? oppositeType : outerType;
              if (type2)
                types[i] = types[BracketStack[sJ]] = type2;
              sI = sJ;
              break;
            }
          }
        } else if (BracketStack.length == 189) {
          break;
        } else {
          BracketStack[sI++] = i;
          BracketStack[sI++] = ch;
          BracketStack[sI++] = context;
        }
      } else if ((type = types[i]) == 2 || type == 1) {
        let embed = type == outerType;
        context = embed ? 0 : 1;
        for (let sJ = sI - 3;sJ >= 0; sJ -= 3) {
          let cur = BracketStack[sJ + 2];
          if (cur & 2)
            break;
          if (embed) {
            BracketStack[sJ + 2] |= 2;
          } else {
            if (cur & 4)
              break;
            BracketStack[sJ + 2] |= 4;
          }
        }
      }
    }
  }
};
var processNeutrals = function(rFrom, rTo, isolates, outerType) {
  for (let iI = 0, prev = outerType;iI <= isolates.length; iI++) {
    let from = iI ? isolates[iI - 1].to : rFrom, to = iI < isolates.length ? isolates[iI].from : rTo;
    for (let i = from;i < to; ) {
      let type = types[i];
      if (type == 256) {
        let end = i + 1;
        for (;; ) {
          if (end == to) {
            if (iI == isolates.length)
              break;
            end = isolates[iI++].to;
            to = iI < isolates.length ? isolates[iI].from : rTo;
          } else if (types[end] == 256) {
            end++;
          } else {
            break;
          }
        }
        let beforeL = prev == 1;
        let afterL = (end < rTo ? types[end] : outerType) == 1;
        let replace = beforeL == afterL ? beforeL ? 1 : 2 : outerType;
        for (let j = end, jI = iI, fromJ = jI ? isolates[jI - 1].to : rFrom;j > i; ) {
          if (j == fromJ) {
            j = isolates[--jI].from;
            fromJ = jI ? isolates[jI - 1].to : rFrom;
          }
          types[--j] = replace;
        }
        i = end;
      } else {
        prev = type;
        i++;
      }
    }
  }
};
var emitSpans = function(line, from, to, level, baseLevel, isolates, order) {
  let ourType = level % 2 ? 2 : 1;
  if (level % 2 == baseLevel % 2) {
    for (let iCh = from, iI = 0;iCh < to; ) {
      let sameDir = true, isNum = false;
      if (iI == isolates.length || iCh < isolates[iI].from) {
        let next = types[iCh];
        if (next != ourType) {
          sameDir = false;
          isNum = next == 16;
        }
      }
      let recurse = !sameDir && ourType == 1 ? [] : null;
      let localLevel = sameDir ? level : level + 1;
      let iScan = iCh;
      run:
        for (;; ) {
          if (iI < isolates.length && iScan == isolates[iI].from) {
            if (isNum)
              break run;
            let iso = isolates[iI];
            if (!sameDir)
              for (let upto = iso.to, jI = iI + 1;; ) {
                if (upto == to)
                  break run;
                if (jI < isolates.length && isolates[jI].from == upto)
                  upto = isolates[jI++].to;
                else if (types[upto] == ourType)
                  break run;
                else
                  break;
              }
            iI++;
            if (recurse) {
              recurse.push(iso);
            } else {
              if (iso.from > iCh)
                order.push(new BidiSpan(iCh, iso.from, localLevel));
              let dirSwap = iso.direction == LTR != !(localLevel % 2);
              computeSectionOrder(line, dirSwap ? level + 1 : level, baseLevel, iso.inner, iso.from, iso.to, order);
              iCh = iso.to;
            }
            iScan = iso.to;
          } else if (iScan == to || (sameDir ? types[iScan] != ourType : types[iScan] == ourType)) {
            break;
          } else {
            iScan++;
          }
        }
      if (recurse)
        emitSpans(line, iCh, iScan, level + 1, baseLevel, recurse, order);
      else if (iCh < iScan)
        order.push(new BidiSpan(iCh, iScan, localLevel));
      iCh = iScan;
    }
  } else {
    for (let iCh = to, iI = isolates.length;iCh > from; ) {
      let sameDir = true, isNum = false;
      if (!iI || iCh > isolates[iI - 1].to) {
        let next = types[iCh - 1];
        if (next != ourType) {
          sameDir = false;
          isNum = next == 16;
        }
      }
      let recurse = !sameDir && ourType == 1 ? [] : null;
      let localLevel = sameDir ? level : level + 1;
      let iScan = iCh;
      run:
        for (;; ) {
          if (iI && iScan == isolates[iI - 1].to) {
            if (isNum)
              break run;
            let iso = isolates[--iI];
            if (!sameDir)
              for (let upto = iso.from, jI = iI;; ) {
                if (upto == from)
                  break run;
                if (jI && isolates[jI - 1].to == upto)
                  upto = isolates[--jI].from;
                else if (types[upto - 1] == ourType)
                  break run;
                else
                  break;
              }
            if (recurse) {
              recurse.push(iso);
            } else {
              if (iso.to < iCh)
                order.push(new BidiSpan(iso.to, iCh, localLevel));
              let dirSwap = iso.direction == LTR != !(localLevel % 2);
              computeSectionOrder(line, dirSwap ? level + 1 : level, baseLevel, iso.inner, iso.from, iso.to, order);
              iCh = iso.from;
            }
            iScan = iso.from;
          } else if (iScan == from || (sameDir ? types[iScan - 1] != ourType : types[iScan - 1] == ourType)) {
            break;
          } else {
            iScan--;
          }
        }
      if (recurse)
        emitSpans(line, iScan, iCh, level + 1, baseLevel, recurse, order);
      else if (iScan < iCh)
        order.push(new BidiSpan(iScan, iCh, localLevel));
      iCh = iScan;
    }
  }
};
var computeSectionOrder = function(line, level, baseLevel, isolates, from, to, order) {
  let outerType = level % 2 ? 2 : 1;
  computeCharTypes(line, from, to, isolates, outerType);
  processBracketPairs(line, from, to, isolates, outerType);
  processNeutrals(from, to, isolates, outerType);
  emitSpans(line, from, to, level, baseLevel, isolates, order);
};
var computeOrder = function(line, direction, isolates) {
  if (!line)
    return [new BidiSpan(0, 0, direction == RTL ? 1 : 0)];
  if (direction == LTR && !isolates.length && !BidiRE.test(line))
    return trivialOrder(line.length);
  if (isolates.length)
    while (line.length > types.length)
      types[types.length] = 256;
  let order = [], level = direction == LTR ? 0 : 1;
  computeSectionOrder(line, level, level, isolates, 0, line.length, order);
  return order;
};
var trivialOrder = function(length) {
  return [new BidiSpan(0, length, 0)];
};
var moveVisually = function(line, order, dir, start, forward) {
  var _a;
  let startIndex = start.head - line.from, spanI = -1;
  if (startIndex == 0) {
    if (!forward || !line.length)
      return null;
    if (order[0].level != dir) {
      startIndex = order[0].side(false, dir);
      spanI = 0;
    }
  } else if (startIndex == line.length) {
    if (forward)
      return null;
    let last = order[order.length - 1];
    if (last.level != dir) {
      startIndex = last.side(true, dir);
      spanI = order.length - 1;
    }
  }
  if (spanI < 0)
    spanI = BidiSpan.find(order, startIndex, (_a = start.bidiLevel) !== null && _a !== undefined ? _a : -1, start.assoc);
  let span = order[spanI];
  if (startIndex == span.side(forward, dir)) {
    span = order[spanI += forward ? 1 : -1];
    startIndex = span.side(!forward, dir);
  }
  let indexForward = forward == (span.dir == dir);
  let nextIndex = findClusterBreak(line.text, startIndex, indexForward);
  movedOver = line.text.slice(Math.min(startIndex, nextIndex), Math.max(startIndex, nextIndex));
  if (nextIndex != span.side(forward, dir))
    return EditorSelection.cursor(nextIndex + line.from, indexForward ? -1 : 1, span.level);
  let nextSpan = spanI == (forward ? order.length - 1 : 0) ? null : order[spanI + (forward ? 1 : -1)];
  if (!nextSpan && span.level != dir)
    return EditorSelection.cursor(forward ? line.to : line.from, forward ? -1 : 1, dir);
  if (nextSpan && nextSpan.level < span.level)
    return EditorSelection.cursor(nextSpan.side(!forward, dir) + line.from, forward ? 1 : -1, nextSpan.level);
  return EditorSelection.cursor(nextIndex + line.from, forward ? -1 : 1, span.level);
};
var betweenUneditable = function(pos) {
  return pos.node.nodeType == 1 && pos.node.firstChild && (pos.offset == 0 || pos.node.childNodes[pos.offset - 1].contentEditable == "false") && (pos.offset == pos.node.childNodes.length || pos.node.childNodes[pos.offset].contentEditable == "false");
};
var findCompositionNode = function(view, headPos) {
  let sel = view.observer.selectionRange;
  let textNode = sel.focusNode && nearbyTextNode(sel.focusNode, sel.focusOffset, 0);
  if (!textNode)
    return null;
  let from = headPos - textNode.offset;
  return { from, to: from + textNode.node.nodeValue.length, node: textNode.node };
};
var findCompositionRange = function(view, changes, headPos) {
  let found = findCompositionNode(view, headPos);
  if (!found)
    return null;
  let { node: textNode, from, to } = found, text = textNode.nodeValue;
  if (/[\n\r]/.test(text))
    return null;
  if (view.state.doc.sliceString(found.from, found.to) != text)
    return null;
  let inv = changes.invertedDesc;
  let range = new ChangedRange(inv.mapPos(from), inv.mapPos(to), from, to);
  let marks = [];
  for (let parent = textNode.parentNode;; parent = parent.parentNode) {
    let parentView = ContentView.get(parent);
    if (parentView instanceof MarkView)
      marks.push({ node: parent, deco: parentView.mark });
    else if (parentView instanceof LineView || parent.nodeName == "DIV" && parent.parentNode == view.contentDOM)
      return { range, text: textNode, marks, line: parent };
    else if (parent != view.contentDOM)
      marks.push({ node: parent, deco: new MarkDecoration({
        inclusive: true,
        attributes: getAttrs(parent),
        tagName: parent.tagName.toLowerCase()
      }) });
    else
      return null;
  }
};
var nearbyTextNode = function(startNode, startOffset, side) {
  if (side <= 0)
    for (let node = startNode, offset = startOffset;; ) {
      if (node.nodeType == 3)
        return { node, offset };
      if (node.nodeType == 1 && offset > 0) {
        node = node.childNodes[offset - 1];
        offset = maxOffset(node);
      } else {
        break;
      }
    }
  if (side >= 0)
    for (let node = startNode, offset = startOffset;; ) {
      if (node.nodeType == 3)
        return { node, offset };
      if (node.nodeType == 1 && offset < node.childNodes.length && side >= 0) {
        node = node.childNodes[offset];
        offset = 0;
      } else {
        break;
      }
    }
  return null;
};
var nextToUneditable = function(node, offset) {
  if (node.nodeType != 1)
    return 0;
  return (offset && node.childNodes[offset - 1].contentEditable == "false" ? 1 : 0) | (offset < node.childNodes.length && node.childNodes[offset].contentEditable == "false" ? 2 : 0);
};
var findChangedDeco = function(a, b, diff) {
  let comp = new DecorationComparator$1;
  RangeSet.compare(a, b, diff, comp);
  return comp.changes;
};
var inUneditable = function(node, inside) {
  for (let cur = node;cur && cur != inside; cur = cur.assignedSlot || cur.parentNode) {
    if (cur.nodeType == 1 && cur.contentEditable == "false") {
      return true;
    }
  }
  return false;
};
var touchesComposition = function(changes, composition) {
  let touched = false;
  if (composition)
    changes.iterChangedRanges((from, to) => {
      if (from < composition.to && to > composition.from)
        touched = true;
    });
  return touched;
};
var groupAt = function(state2, pos, bias = 1) {
  let categorize = state2.charCategorizer(pos);
  let line = state2.doc.lineAt(pos), linePos = pos - line.from;
  if (line.length == 0)
    return EditorSelection.cursor(pos);
  if (linePos == 0)
    bias = 1;
  else if (linePos == line.length)
    bias = -1;
  let from = linePos, to = linePos;
  if (bias < 0)
    from = findClusterBreak(line.text, linePos, false);
  else
    to = findClusterBreak(line.text, linePos);
  let cat = categorize(line.text.slice(from, to));
  while (from > 0) {
    let prev = findClusterBreak(line.text, from, false);
    if (categorize(line.text.slice(prev, from)) != cat)
      break;
    from = prev;
  }
  while (to < line.length) {
    let next = findClusterBreak(line.text, to);
    if (categorize(line.text.slice(to, next)) != cat)
      break;
    to = next;
  }
  return EditorSelection.range(from + line.from, to + line.from);
};
var getdx = function(x, rect) {
  return rect.left > x ? rect.left - x : Math.max(0, x - rect.right);
};
var getdy = function(y, rect) {
  return rect.top > y ? rect.top - y : Math.max(0, y - rect.bottom);
};
var yOverlap = function(a, b) {
  return a.top < b.bottom - 1 && a.bottom > b.top + 1;
};
var upTop = function(rect, top2) {
  return top2 < rect.top ? { top: top2, left: rect.left, right: rect.right, bottom: rect.bottom } : rect;
};
var upBot = function(rect, bottom) {
  return bottom > rect.bottom ? { top: rect.top, left: rect.left, right: rect.right, bottom } : rect;
};
var domPosAtCoords = function(parent, x, y) {
  let closest, closestRect, closestX, closestY, closestOverlap = false;
  let above, below, aboveRect, belowRect;
  for (let child = parent.firstChild;child; child = child.nextSibling) {
    let rects = clientRectsFor(child);
    for (let i = 0;i < rects.length; i++) {
      let rect = rects[i];
      if (closestRect && yOverlap(closestRect, rect))
        rect = upTop(upBot(rect, closestRect.bottom), closestRect.top);
      let dx = getdx(x, rect), dy = getdy(y, rect);
      if (dx == 0 && dy == 0)
        return child.nodeType == 3 ? domPosInText(child, x, y) : domPosAtCoords(child, x, y);
      if (!closest || closestY > dy || closestY == dy && closestX > dx) {
        closest = child;
        closestRect = rect;
        closestX = dx;
        closestY = dy;
        let side = dy ? y < rect.top ? -1 : 1 : dx ? x < rect.left ? -1 : 1 : 0;
        closestOverlap = !side || (side > 0 ? i < rects.length - 1 : i > 0);
      }
      if (dx == 0) {
        if (y > rect.bottom && (!aboveRect || aboveRect.bottom < rect.bottom)) {
          above = child;
          aboveRect = rect;
        } else if (y < rect.top && (!belowRect || belowRect.top > rect.top)) {
          below = child;
          belowRect = rect;
        }
      } else if (aboveRect && yOverlap(aboveRect, rect)) {
        aboveRect = upBot(aboveRect, rect.bottom);
      } else if (belowRect && yOverlap(belowRect, rect)) {
        belowRect = upTop(belowRect, rect.top);
      }
    }
  }
  if (aboveRect && aboveRect.bottom >= y) {
    closest = above;
    closestRect = aboveRect;
  } else if (belowRect && belowRect.top <= y) {
    closest = below;
    closestRect = belowRect;
  }
  if (!closest)
    return { node: parent, offset: 0 };
  let clipX = Math.max(closestRect.left, Math.min(closestRect.right, x));
  if (closest.nodeType == 3)
    return domPosInText(closest, clipX, y);
  if (closestOverlap && closest.contentEditable != "false")
    return domPosAtCoords(closest, clipX, y);
  let offset = Array.prototype.indexOf.call(parent.childNodes, closest) + (x >= (closestRect.left + closestRect.right) / 2 ? 1 : 0);
  return { node: parent, offset };
};
var domPosInText = function(node, x, y) {
  let len = node.nodeValue.length;
  let closestOffset = -1, closestDY = 1e9, generalSide = 0;
  for (let i = 0;i < len; i++) {
    let rects = textRange(node, i, i + 1).getClientRects();
    for (let j = 0;j < rects.length; j++) {
      let rect = rects[j];
      if (rect.top == rect.bottom)
        continue;
      if (!generalSide)
        generalSide = x - rect.left;
      let dy = (rect.top > y ? rect.top - y : y - rect.bottom) - 1;
      if (rect.left - 1 <= x && rect.right + 1 >= x && dy < closestDY) {
        let right = x >= (rect.left + rect.right) / 2, after = right;
        if (browser.chrome || browser.gecko) {
          let rectBefore = textRange(node, i).getBoundingClientRect();
          if (rectBefore.left == rect.right)
            after = !right;
        }
        if (dy <= 0)
          return { node, offset: i + (after ? 1 : 0) };
        closestOffset = i + (after ? 1 : 0);
        closestDY = dy;
      }
    }
  }
  return { node, offset: closestOffset > -1 ? closestOffset : generalSide > 0 ? node.nodeValue.length : 0 };
};
var posAtCoords = function(view, coords, precise, bias = -1) {
  var _a, _b;
  let content = view.contentDOM.getBoundingClientRect(), docTop = content.top + view.viewState.paddingTop;
  let block, { docHeight } = view.viewState;
  let { x, y } = coords, yOffset = y - docTop;
  if (yOffset < 0)
    return 0;
  if (yOffset > docHeight)
    return view.state.doc.length;
  for (let halfLine = view.viewState.heightOracle.textHeight / 2, bounced = false;; ) {
    block = view.elementAtHeight(yOffset);
    if (block.type == BlockType.Text)
      break;
    for (;; ) {
      yOffset = bias > 0 ? block.bottom + halfLine : block.top - halfLine;
      if (yOffset >= 0 && yOffset <= docHeight)
        break;
      if (bounced)
        return precise ? null : 0;
      bounced = true;
      bias = -bias;
    }
  }
  y = docTop + yOffset;
  let lineStart = block.from;
  if (lineStart < view.viewport.from)
    return view.viewport.from == 0 ? 0 : precise ? null : posAtCoordsImprecise(view, content, block, x, y);
  if (lineStart > view.viewport.to)
    return view.viewport.to == view.state.doc.length ? view.state.doc.length : precise ? null : posAtCoordsImprecise(view, content, block, x, y);
  let doc = view.dom.ownerDocument;
  let root = view.root.elementFromPoint ? view.root : doc;
  let element = root.elementFromPoint(x, y);
  if (element && !view.contentDOM.contains(element))
    element = null;
  if (!element) {
    x = Math.max(content.left + 1, Math.min(content.right - 1, x));
    element = root.elementFromPoint(x, y);
    if (element && !view.contentDOM.contains(element))
      element = null;
  }
  let node, offset = -1;
  if (element && ((_a = view.docView.nearest(element)) === null || _a === undefined ? undefined : _a.isEditable) != false) {
    if (doc.caretPositionFromPoint) {
      let pos = doc.caretPositionFromPoint(x, y);
      if (pos)
        ({ offsetNode: node, offset } = pos);
    } else if (doc.caretRangeFromPoint) {
      let range = doc.caretRangeFromPoint(x, y);
      if (range) {
        ({ startContainer: node, startOffset: offset } = range);
        if (!view.contentDOM.contains(node) || browser.safari && isSuspiciousSafariCaretResult(node, offset, x) || browser.chrome && isSuspiciousChromeCaretResult(node, offset, x))
          node = undefined;
      }
    }
  }
  if (!node || !view.docView.dom.contains(node)) {
    let line = LineView.find(view.docView, lineStart);
    if (!line)
      return yOffset > block.top + block.height / 2 ? block.to : block.from;
    ({ node, offset } = domPosAtCoords(line.dom, x, y));
  }
  let nearest = view.docView.nearest(node);
  if (!nearest)
    return null;
  if (nearest.isWidget && ((_b = nearest.dom) === null || _b === undefined ? undefined : _b.nodeType) == 1) {
    let rect = nearest.dom.getBoundingClientRect();
    return coords.y < rect.top || coords.y <= rect.bottom && coords.x <= (rect.left + rect.right) / 2 ? nearest.posAtStart : nearest.posAtEnd;
  } else {
    return nearest.localPosFromDOM(node, offset) + nearest.posAtStart;
  }
};
var posAtCoordsImprecise = function(view, contentRect, block, x, y) {
  let into = Math.round((x - contentRect.left) * view.defaultCharacterWidth);
  if (view.lineWrapping && block.height > view.defaultLineHeight * 1.5) {
    let textHeight = view.viewState.heightOracle.textHeight;
    let line = Math.floor((y - block.top - (view.defaultLineHeight - textHeight) * 0.5) / textHeight);
    into += line * view.viewState.heightOracle.lineLength;
  }
  let content = view.state.sliceDoc(block.from, block.to);
  return block.from + findColumn(content, into, view.state.tabSize);
};
var isSuspiciousSafariCaretResult = function(node, offset, x) {
  let len;
  if (node.nodeType != 3 || offset != (len = node.nodeValue.length))
    return false;
  for (let next = node.nextSibling;next; next = next.nextSibling)
    if (next.nodeType != 1 || next.nodeName != "BR")
      return false;
  return textRange(node, len - 1, len).getBoundingClientRect().left > x;
};
var isSuspiciousChromeCaretResult = function(node, offset, x) {
  if (offset != 0)
    return false;
  for (let cur = node;; ) {
    let parent = cur.parentNode;
    if (!parent || parent.nodeType != 1 || parent.firstChild != cur)
      return false;
    if (parent.classList.contains("cm-line"))
      break;
    cur = parent;
  }
  let rect = node.nodeType == 1 ? node.getBoundingClientRect() : textRange(node, 0, Math.max(node.nodeValue.length, 1)).getBoundingClientRect();
  return x - rect.left > 5;
};
var blockAt = function(view, pos) {
  let line = view.lineBlockAt(pos);
  if (Array.isArray(line.type))
    for (let l of line.type) {
      if (l.to > pos || l.to == pos && (l.to == line.to || l.type == BlockType.Text))
        return l;
    }
  return line;
};
var moveToLineBoundary = function(view, start, forward, includeWrap) {
  let line = blockAt(view, start.head);
  let coords = !includeWrap || line.type != BlockType.Text || !(view.lineWrapping || line.widgetLineBreaks) ? null : view.coordsAtPos(start.assoc < 0 && start.head > line.from ? start.head - 1 : start.head);
  if (coords) {
    let editorRect = view.dom.getBoundingClientRect();
    let direction = view.textDirectionAt(line.from);
    let pos = view.posAtCoords({
      x: forward == (direction == Direction.LTR) ? editorRect.right - 1 : editorRect.left + 1,
      y: (coords.top + coords.bottom) / 2
    });
    if (pos != null)
      return EditorSelection.cursor(pos, forward ? -1 : 1);
  }
  return EditorSelection.cursor(forward ? line.to : line.from, forward ? -1 : 1);
};
var moveByChar = function(view, start, forward, by) {
  let line = view.state.doc.lineAt(start.head), spans = view.bidiSpans(line);
  let direction = view.textDirectionAt(line.from);
  for (let cur = start, check = null;; ) {
    let next = moveVisually(line, spans, direction, cur, forward), char = movedOver;
    if (!next) {
      if (line.number == (forward ? view.state.doc.lines : 1))
        return cur;
      char = "\n";
      line = view.state.doc.line(line.number + (forward ? 1 : -1));
      spans = view.bidiSpans(line);
      next = EditorSelection.cursor(forward ? line.from : line.to);
    }
    if (!check) {
      if (!by)
        return next;
      check = by(char);
    } else if (!check(char)) {
      return cur;
    }
    cur = next;
  }
};
var byGroup = function(view, pos, start) {
  let categorize = view.state.charCategorizer(pos);
  let cat = categorize(start);
  return (next) => {
    let nextCat = categorize(next);
    if (cat == CharCategory.Space)
      cat = nextCat;
    return cat == nextCat;
  };
};
var moveVertically = function(view, start, forward, distance) {
  let startPos = start.head, dir = forward ? 1 : -1;
  if (startPos == (forward ? view.state.doc.length : 0))
    return EditorSelection.cursor(startPos, start.assoc);
  let goal = start.goalColumn, startY;
  let rect = view.contentDOM.getBoundingClientRect();
  let startCoords = view.coordsAtPos(startPos), docTop = view.documentTop;
  if (startCoords) {
    if (goal == null)
      goal = startCoords.left - rect.left;
    startY = dir < 0 ? startCoords.top : startCoords.bottom;
  } else {
    let line = view.viewState.lineBlockAt(startPos);
    if (goal == null)
      goal = Math.min(rect.right - rect.left, view.defaultCharacterWidth * (startPos - line.from));
    startY = (dir < 0 ? line.top : line.bottom) + docTop;
  }
  let resolvedGoal = rect.left + goal;
  let dist = distance !== null && distance !== undefined ? distance : view.viewState.heightOracle.textHeight >> 1;
  for (let extra = 0;; extra += 10) {
    let curY = startY + (dist + extra) * dir;
    let pos = posAtCoords(view, { x: resolvedGoal, y: curY }, false, dir);
    if (curY < rect.top || curY > rect.bottom || (dir < 0 ? pos < startPos : pos > startPos))
      return EditorSelection.cursor(pos, start.assoc, undefined, goal);
  }
};
var skipAtomicRanges = function(atoms, pos, bias) {
  for (;; ) {
    let moved = 0;
    for (let set of atoms) {
      set.between(pos - 1, pos + 1, (from, to, value) => {
        if (pos > from && pos < to) {
          let side = moved || bias || (pos - from < to - pos ? -1 : 1);
          pos = side < 0 ? from : to;
          moved = side;
        }
      });
    }
    if (!moved)
      return pos;
  }
};
var skipAtoms = function(view, oldPos, pos) {
  let newPos = skipAtomicRanges(view.state.facet(atomicRanges).map((f) => f(view)), pos.from, oldPos.head > pos.from ? -1 : 1);
  return newPos == pos.from ? pos : EditorSelection.cursor(newPos, newPos < pos.from ? 1 : -1);
};
var dragScrollSpeed = function(dist) {
  return Math.max(0, dist) * 0.7 + 8;
};
var dist = function(a, b) {
  return Math.max(Math.abs(a.clientX - b.clientX), Math.abs(a.clientY - b.clientY));
};
var addsSelectionRange = function(view, event) {
  let facet = view.state.facet(clickAddsSelectionRange);
  return facet.length ? facet[0](event) : browser.mac ? event.metaKey : event.ctrlKey;
};
var dragMovesSelection = function(view, event) {
  let facet = view.state.facet(dragMovesSelection$1);
  return facet.length ? facet[0](event) : browser.mac ? !event.altKey : !event.ctrlKey;
};
var isInPrimarySelection = function(view, event) {
  let { main } = view.state.selection;
  if (main.empty)
    return false;
  let sel = getSelection(view.root);
  if (!sel || sel.rangeCount == 0)
    return true;
  let rects = sel.getRangeAt(0).getClientRects();
  for (let i = 0;i < rects.length; i++) {
    let rect = rects[i];
    if (rect.left <= event.clientX && rect.right >= event.clientX && rect.top <= event.clientY && rect.bottom >= event.clientY)
      return true;
  }
  return false;
};
var eventBelongsToEditor = function(view, event) {
  if (!event.bubbles)
    return true;
  if (event.defaultPrevented)
    return false;
  for (let node = event.target, cView;node != view.contentDOM; node = node.parentNode)
    if (!node || node.nodeType == 11 || (cView = ContentView.get(node)) && cView.ignoreEvent(event))
      return false;
  return true;
};
var capturePaste = function(view) {
  let parent = view.dom.parentNode;
  if (!parent)
    return;
  let target = parent.appendChild(document.createElement("textarea"));
  target.style.cssText = "position: fixed; left: -10000px; top: 10px";
  target.focus();
  setTimeout(() => {
    view.focus();
    target.remove();
    doPaste(view, target.value);
  }, 50);
};
var doPaste = function(view, input) {
  let { state: state2 } = view, changes, i = 1, text = state2.toText(input);
  let byLine = text.lines == state2.selection.ranges.length;
  let linewise = lastLinewiseCopy != null && state2.selection.ranges.every((r) => r.empty) && lastLinewiseCopy == text.toString();
  if (linewise) {
    let lastLine = -1;
    changes = state2.changeByRange((range) => {
      let line = state2.doc.lineAt(range.from);
      if (line.from == lastLine)
        return { range };
      lastLine = line.from;
      let insert2 = state2.toText((byLine ? text.line(i++).text : input) + state2.lineBreak);
      return {
        changes: { from: line.from, insert: insert2 },
        range: EditorSelection.cursor(range.from + insert2.length)
      };
    });
  } else if (byLine) {
    changes = state2.changeByRange((range) => {
      let line = text.line(i++);
      return {
        changes: { from: range.from, to: range.to, insert: line.text },
        range: EditorSelection.cursor(range.from + line.length)
      };
    });
  } else {
    changes = state2.replaceSelection(text);
  }
  view.dispatch(changes, {
    userEvent: "input.paste",
    scrollIntoView: true
  });
};
var rangeForClick = function(view, pos, bias, type) {
  if (type == 1) {
    return EditorSelection.cursor(pos, bias);
  } else if (type == 2) {
    return groupAt(view.state, pos, bias);
  } else {
    let visual = LineView.find(view.docView, pos), line = view.state.doc.lineAt(visual ? visual.posAtEnd : pos);
    let from = visual ? visual.posAtStart : line.from, to = visual ? visual.posAtEnd : line.to;
    if (to < view.state.doc.length && to == line.to)
      to++;
    return EditorSelection.range(from, to);
  }
};
var findPositionSide = function(view, pos, x, y) {
  let line = LineView.find(view.docView, pos);
  if (!line)
    return 1;
  let off = pos - line.posAtStart;
  if (off == 0)
    return 1;
  if (off == line.length)
    return -1;
  let before = line.coordsAt(off, -1);
  if (before && inside(x, y, before))
    return -1;
  let after = line.coordsAt(off, 1);
  if (after && inside(x, y, after))
    return 1;
  return before && insideY(y, before) ? -1 : 1;
};
var queryPos = function(view, event) {
  let pos = view.posAtCoords({ x: event.clientX, y: event.clientY }, false);
  return { pos, bias: findPositionSide(view, pos, event.clientX, event.clientY) };
};
var getClickType = function(event) {
  if (!BadMouseDetail)
    return event.detail;
  let last = lastMouseDown, lastTime = lastMouseDownTime;
  lastMouseDown = event;
  lastMouseDownTime = Date.now();
  return lastMouseDownCount = !last || lastTime > Date.now() - 400 && Math.abs(last.clientX - event.clientX) < 2 && Math.abs(last.clientY - event.clientY) < 2 ? (lastMouseDownCount + 1) % 3 : 1;
};
var basicMouseSelection = function(view, event) {
  let start = queryPos(view, event), type = getClickType(event);
  let startSel = view.state.selection;
  return {
    update(update) {
      if (update.docChanged) {
        start.pos = update.changes.mapPos(start.pos);
        startSel = startSel.map(update.changes);
      }
    },
    get(event2, extend2, multiple) {
      let cur = queryPos(view, event2), removed;
      let range = rangeForClick(view, cur.pos, cur.bias, type);
      if (start.pos != cur.pos && !extend2) {
        let startRange = rangeForClick(view, start.pos, start.bias, type);
        let from = Math.min(startRange.from, range.from), to = Math.max(startRange.to, range.to);
        range = from < range.from ? EditorSelection.range(from, to) : EditorSelection.range(to, from);
      }
      if (extend2)
        return startSel.replaceRange(startSel.main.extend(range.from, range.to));
      else if (multiple && type == 1 && startSel.ranges.length > 1 && (removed = removeRangeAround(startSel, cur.pos)))
        return removed;
      else if (multiple)
        return startSel.addRange(range);
      else
        return EditorSelection.create([range]);
    }
  };
};
var removeRangeAround = function(sel, pos) {
  for (let i = 0;i < sel.ranges.length; i++) {
    let { from, to } = sel.ranges[i];
    if (from <= pos && to >= pos)
      return EditorSelection.create(sel.ranges.slice(0, i).concat(sel.ranges.slice(i + 1)), sel.mainIndex == i ? 0 : sel.mainIndex - (sel.mainIndex > i ? 1 : 0));
  }
  return null;
};
var dropText = function(view, event, text, direct) {
  if (!text)
    return;
  let dropPos = view.posAtCoords({ x: event.clientX, y: event.clientY }, false);
  event.preventDefault();
  let { mouseSelection } = view.inputState;
  let del = direct && mouseSelection && mouseSelection.dragging && dragMovesSelection(view, event) ? { from: mouseSelection.dragging.from, to: mouseSelection.dragging.to } : null;
  let ins = { from: dropPos, insert: text };
  let changes = view.state.changes(del ? [del, ins] : ins);
  view.focus();
  view.dispatch({
    changes,
    selection: { anchor: changes.mapPos(dropPos, -1), head: changes.mapPos(dropPos, 1) },
    userEvent: del ? "move.drop" : "input.drop"
  });
};
var captureCopy = function(view, text) {
  let parent = view.dom.parentNode;
  if (!parent)
    return;
  let target = parent.appendChild(document.createElement("textarea"));
  target.style.cssText = "position: fixed; left: -10000px; top: 10px";
  target.value = text;
  target.focus();
  target.selectionEnd = text.length;
  target.selectionStart = 0;
  setTimeout(() => {
    target.remove();
    view.focus();
  }, 50);
};
var copiedRange = function(state2) {
  let content = [], ranges = [], linewise = false;
  for (let range of state2.selection.ranges)
    if (!range.empty) {
      content.push(state2.sliceDoc(range.from, range.to));
      ranges.push(range);
    }
  if (!content.length) {
    let upto = -1;
    for (let { from } of state2.selection.ranges) {
      let line = state2.doc.lineAt(from);
      if (line.number > upto) {
        content.push(line.text);
        ranges.push({ from: line.from, to: Math.min(state2.doc.length, line.to + 1) });
      }
      upto = line.number;
    }
    linewise = true;
  }
  return { text: content.join(state2.lineBreak), ranges, linewise };
};
var focusChangeTransaction = function(state2, focus) {
  let effects = [];
  for (let getEffect of state2.facet(focusChangeEffect)) {
    let effect = getEffect(state2, focus);
    if (effect)
      effects.push(effect);
  }
  return effects ? state2.update({ effects, annotations: isFocusChange.of(true) }) : null;
};
var updateForFocusChange = function(view) {
  setTimeout(() => {
    let focus = view.hasFocus;
    if (focus != view.inputState.notifiedFocused) {
      let tr = focusChangeTransaction(view.state, focus);
      if (tr)
        view.dispatch(tr);
      else
        view.update([]);
    }
  }, 10);
};
var firefoxCopyCutHack = function(doc) {
  if (!appliedFirefoxHack.has(doc)) {
    appliedFirefoxHack.add(doc);
    doc.addEventListener("copy", () => {
    });
    doc.addEventListener("cut", () => {
    });
  }
};
var mergeGaps = function(nodes, around) {
  let before, after;
  if (nodes[around] == null && (before = nodes[around - 1]) instanceof HeightMapGap && (after = nodes[around + 1]) instanceof HeightMapGap)
    nodes.splice(around - 1, 3, new HeightMapGap(before.length + 1 + after.length));
};
var heightRelevantDecoChanges = function(a, b, diff) {
  let comp = new DecorationComparator2;
  RangeSet.compare(a, b, diff, comp, 0);
  return comp.changes;
};
var visiblePixelRange = function(dom, paddingTop) {
  let rect = dom.getBoundingClientRect();
  let doc = dom.ownerDocument, win = doc.defaultView || window;
  let left = Math.max(0, rect.left), right = Math.min(win.innerWidth, rect.right);
  let top2 = Math.max(0, rect.top), bottom = Math.min(win.innerHeight, rect.bottom);
  for (let parent = dom.parentNode;parent && parent != doc.body; ) {
    if (parent.nodeType == 1) {
      let elt = parent;
      let style = window.getComputedStyle(elt);
      if ((elt.scrollHeight > elt.clientHeight || elt.scrollWidth > elt.clientWidth) && style.overflow != "visible") {
        let parentRect = elt.getBoundingClientRect();
        left = Math.max(left, parentRect.left);
        right = Math.min(right, parentRect.right);
        top2 = Math.max(top2, parentRect.top);
        bottom = parent == dom.parentNode ? parentRect.bottom : Math.min(bottom, parentRect.bottom);
      }
      parent = style.position == "absolute" || style.position == "fixed" ? elt.offsetParent : elt.parentNode;
    } else if (parent.nodeType == 11) {
      parent = parent.host;
    } else {
      break;
    }
  }
  return {
    left: left - rect.left,
    right: Math.max(left, right) - rect.left,
    top: top2 - (rect.top + paddingTop),
    bottom: Math.max(top2, bottom) - (rect.top + paddingTop)
  };
};
var fullPixelRange = function(dom, paddingTop) {
  let rect = dom.getBoundingClientRect();
  return {
    left: 0,
    right: rect.right - rect.left,
    top: paddingTop,
    bottom: rect.bottom - (rect.top + paddingTop)
  };
};
var lineStructure = function(from, to, stateDeco) {
  let ranges = [], pos = from, total = 0;
  RangeSet.spans(stateDeco, from, to, {
    span() {
    },
    point(from2, to2) {
      if (from2 > pos) {
        ranges.push({ from: pos, to: from2 });
        total += from2 - pos;
      }
      pos = to2;
    }
  }, 20);
  if (pos < to) {
    ranges.push({ from: pos, to });
    total += to - pos;
  }
  return { total, ranges };
};
var findPosition = function({ total, ranges }, ratio) {
  if (ratio <= 0)
    return ranges[0].from;
  if (ratio >= 1)
    return ranges[ranges.length - 1].to;
  let dist2 = Math.floor(total * ratio);
  for (let i = 0;; i++) {
    let { from, to } = ranges[i], size = to - from;
    if (dist2 <= size)
      return from + dist2;
    dist2 -= size;
  }
};
var findFraction = function(structure, pos) {
  let counted = 0;
  for (let { from, to } of structure.ranges) {
    if (pos <= to) {
      counted += pos - from;
      break;
    }
    counted += to - from;
  }
  return counted / structure.total;
};
var find = function(array, f) {
  for (let val of array)
    if (f(val))
      return val;
  return;
};
var scaleBlock = function(block, scaler) {
  if (scaler.scale == 1)
    return block;
  let bTop = scaler.toDOM(block.top), bBottom = scaler.toDOM(block.bottom);
  return new BlockInfo(block.from, block.length, bTop, bBottom - bTop, Array.isArray(block._content) ? block._content.map((b) => scaleBlock(b, scaler)) : block._content);
};
var buildTheme = function(main, spec, scopes) {
  return new StyleModule(spec, {
    finish(sel) {
      return /&/.test(sel) ? sel.replace(/&\w*/, (m) => {
        if (m == "&")
          return main;
        if (!scopes || !scopes[m])
          throw new RangeError(`Unsupported selector: ${m}`);
        return scopes[m];
      }) : main + " " + sel;
    }
  });
};
var isBlockElement = function(node) {
  return node.nodeType == 1 && /^(DIV|P|LI|UL|OL|BLOCKQUOTE|DD|DT|H\d|SECTION|PRE)$/.test(node.nodeName);
};
var applyDOMChange = function(view, domChange) {
  let change;
  let { newSel } = domChange, sel = view.state.selection.main;
  let lastKey = view.inputState.lastKeyTime > Date.now() - 100 ? view.inputState.lastKeyCode : -1;
  if (domChange.bounds) {
    let { from, to } = domChange.bounds;
    let preferredPos = sel.from, preferredSide = null;
    if (lastKey === 8 || browser.android && domChange.text.length < to - from) {
      preferredPos = sel.to;
      preferredSide = "end";
    }
    let diff = findDiff(view.state.doc.sliceString(from, to, LineBreakPlaceholder), domChange.text, preferredPos - from, preferredSide);
    if (diff) {
      if (browser.chrome && lastKey == 13 && diff.toB == diff.from + 2 && domChange.text.slice(diff.from, diff.toB) == LineBreakPlaceholder + LineBreakPlaceholder)
        diff.toB--;
      change = {
        from: from + diff.from,
        to: from + diff.toA,
        insert: Text.of(domChange.text.slice(diff.from, diff.toB).split(LineBreakPlaceholder))
      };
    }
  } else if (newSel && (!view.hasFocus && view.state.facet(editable) || newSel.main.eq(sel))) {
    newSel = null;
  }
  if (!change && !newSel)
    return false;
  if (!change && domChange.typeOver && !sel.empty && newSel && newSel.main.empty) {
    change = { from: sel.from, to: sel.to, insert: view.state.doc.slice(sel.from, sel.to) };
  } else if (change && change.from >= sel.from && change.to <= sel.to && (change.from != sel.from || change.to != sel.to) && sel.to - sel.from - (change.to - change.from) <= 4) {
    change = {
      from: sel.from,
      to: sel.to,
      insert: view.state.doc.slice(sel.from, change.from).append(change.insert).append(view.state.doc.slice(change.to, sel.to))
    };
  } else if ((browser.mac || browser.android) && change && change.from == change.to && change.from == sel.head - 1 && /^\. ?$/.test(change.insert.toString()) && view.contentDOM.getAttribute("autocorrect") == "off") {
    if (newSel && change.insert.length == 2)
      newSel = EditorSelection.single(newSel.main.anchor - 1, newSel.main.head - 1);
    change = { from: sel.from, to: sel.to, insert: Text.of([" "]) };
  } else if (browser.chrome && change && change.from == change.to && change.from == sel.head && change.insert.toString() == "\n " && view.lineWrapping) {
    if (newSel)
      newSel = EditorSelection.single(newSel.main.anchor - 1, newSel.main.head - 1);
    change = { from: sel.from, to: sel.to, insert: Text.of([" "]) };
  }
  if (change) {
    if (browser.ios && view.inputState.flushIOSKey(view))
      return true;
    if (browser.android && (change.from == sel.from && change.to == sel.to && change.insert.length == 1 && change.insert.lines == 2 && dispatchKey(view.contentDOM, "Enter", 13) || (change.from == sel.from - 1 && change.to == sel.to && change.insert.length == 0 || lastKey == 8 && change.insert.length < change.to - change.from && change.to > sel.head) && dispatchKey(view.contentDOM, "Backspace", 8) || change.from == sel.from && change.to == sel.to + 1 && change.insert.length == 0 && dispatchKey(view.contentDOM, "Delete", 46)))
      return true;
    let text = change.insert.toString();
    if (view.inputState.composing >= 0)
      view.inputState.composing++;
    let defaultTr;
    let defaultInsert = () => defaultTr || (defaultTr = applyDefaultInsert(view, change, newSel));
    if (!view.state.facet(inputHandler).some((h) => h(view, change.from, change.to, text, defaultInsert)))
      view.dispatch(defaultInsert());
    return true;
  } else if (newSel && !newSel.main.eq(sel)) {
    let scrollIntoView = false, userEvent = "select";
    if (view.inputState.lastSelectionTime > Date.now() - 50) {
      if (view.inputState.lastSelectionOrigin == "select")
        scrollIntoView = true;
      userEvent = view.inputState.lastSelectionOrigin;
    }
    view.dispatch({ selection: newSel, scrollIntoView, userEvent });
    return true;
  } else {
    return false;
  }
};
var applyDefaultInsert = function(view, change, newSel) {
  let tr, startState = view.state, sel = startState.selection.main;
  if (change.from >= sel.from && change.to <= sel.to && change.to - change.from >= (sel.to - sel.from) / 3 && (!newSel || newSel.main.empty && newSel.main.from == change.from + change.insert.length) && view.inputState.composing < 0) {
    let before = sel.from < change.from ? startState.sliceDoc(sel.from, change.from) : "";
    let after = sel.to > change.to ? startState.sliceDoc(change.to, sel.to) : "";
    tr = startState.replaceSelection(view.state.toText(before + change.insert.sliceString(0, undefined, view.state.lineBreak) + after));
  } else {
    let changes = startState.changes(change);
    let mainSel = newSel && newSel.main.to <= changes.newLength ? newSel.main : undefined;
    if (startState.selection.ranges.length > 1 && view.inputState.composing >= 0 && change.to <= sel.to && change.to >= sel.to - 10) {
      let replaced = view.state.sliceDoc(change.from, change.to);
      let compositionRange, composition = newSel && findCompositionNode(view, newSel.main.head);
      if (composition) {
        let dLen = change.insert.length - (change.to - change.from);
        compositionRange = { from: composition.from, to: composition.to - dLen };
      } else {
        compositionRange = view.state.doc.lineAt(sel.head);
      }
      let offset = sel.to - change.to, size = sel.to - sel.from;
      tr = startState.changeByRange((range) => {
        if (range.from == sel.from && range.to == sel.to)
          return { changes, range: mainSel || range.map(changes) };
        let to = range.to - offset, from = to - replaced.length;
        if (range.to - range.from != size || view.state.sliceDoc(from, to) != replaced || range.to >= compositionRange.from && range.from <= compositionRange.to)
          return { range };
        let rangeChanges = startState.changes({ from, to, insert: change.insert }), selOff = range.to - sel.to;
        return {
          changes: rangeChanges,
          range: !mainSel ? range.map(rangeChanges) : EditorSelection.range(Math.max(0, mainSel.anchor + selOff), Math.max(0, mainSel.head + selOff))
        };
      });
    } else {
      tr = {
        changes,
        selection: mainSel && startState.selection.replaceRange(mainSel)
      };
    }
  }
  let userEvent = "input.type";
  if (view.composing || view.inputState.compositionPendingChange && view.inputState.compositionEndedAt > Date.now() - 50) {
    view.inputState.compositionPendingChange = false;
    userEvent += ".compose";
    if (view.inputState.compositionFirstChange) {
      userEvent += ".start";
      view.inputState.compositionFirstChange = false;
    }
  }
  return startState.update(tr, { userEvent, scrollIntoView: true });
};
var findDiff = function(a, b, preferredPos, preferredSide) {
  let minLen = Math.min(a.length, b.length);
  let from = 0;
  while (from < minLen && a.charCodeAt(from) == b.charCodeAt(from))
    from++;
  if (from == minLen && a.length == b.length)
    return null;
  let toA = a.length, toB = b.length;
  while (toA > 0 && toB > 0 && a.charCodeAt(toA - 1) == b.charCodeAt(toB - 1)) {
    toA--;
    toB--;
  }
  if (preferredSide == "end") {
    let adjust = Math.max(0, from - Math.min(toA, toB));
    preferredPos -= toA + adjust - from;
  }
  if (toA < from && a.length < b.length) {
    let move = preferredPos <= from && preferredPos >= toA ? from - preferredPos : 0;
    from -= move;
    toB = from + (toB - toA);
    toA = from;
  } else if (toB < from) {
    let move = preferredPos <= from && preferredPos >= toB ? from - preferredPos : 0;
    from -= move;
    toA = from + (toA - toB);
    toB = from;
  }
  return { from, toA, toB };
};
var selectionPoints = function(view) {
  let result = [];
  if (view.root.activeElement != view.contentDOM)
    return result;
  let { anchorNode, anchorOffset, focusNode, focusOffset } = view.observer.selectionRange;
  if (anchorNode) {
    result.push(new DOMPoint(anchorNode, anchorOffset));
    if (focusNode != anchorNode || focusOffset != anchorOffset)
      result.push(new DOMPoint(focusNode, focusOffset));
  }
  return result;
};
var selectionFromPoints = function(points, base2) {
  if (points.length == 0)
    return null;
  let anchor = points[0].pos, head = points.length == 2 ? points[1].pos : anchor;
  return anchor > -1 && head > -1 ? EditorSelection.single(anchor + base2, head + base2) : null;
};
var findChild = function(cView, dom, dir) {
  while (dom) {
    let curView = ContentView.get(dom);
    if (curView && curView.parent == cView)
      return curView;
    let parent = dom.parentNode;
    dom = parent != cView.dom ? parent : dir > 0 ? dom.nextSibling : dom.previousSibling;
  }
  return null;
};
var safariSelectionRangeHack = function(view) {
  let found = null;
  function read(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    found = event.getTargetRanges()[0];
  }
  view.contentDOM.addEventListener("beforeinput", read, true);
  view.dom.ownerDocument.execCommand("indent");
  view.contentDOM.removeEventListener("beforeinput", read, true);
  if (!found)
    return null;
  let { startContainer: anchorNode, startOffset: anchorOffset } = found;
  let { endContainer: focusNode, endOffset: focusOffset } = found;
  let curAnchor = view.docView.domAtPos(view.state.selection.main.anchor);
  if (isEquivalentPosition(curAnchor.node, curAnchor.offset, focusNode, focusOffset))
    [anchorNode, anchorOffset, focusNode, focusOffset] = [focusNode, focusOffset, anchorNode, anchorOffset];
  return { anchorNode, anchorOffset, focusNode, focusOffset };
};
var attrsFromFacet = function(view, facet, base2) {
  for (let sources = view.state.facet(facet), i = sources.length - 1;i >= 0; i--) {
    let source = sources[i], value = typeof source == "function" ? source(view) : source;
    if (value)
      combineAttrs(value, base2);
  }
  return base2;
};
var normalizeKeyName = function(name, platform) {
  const parts = name.split(/-(?!$)/);
  let result = parts[parts.length - 1];
  if (result == "Space")
    result = " ";
  let alt, ctrl, shift2, meta;
  for (let i = 0;i < parts.length - 1; ++i) {
    const mod = parts[i];
    if (/^(cmd|meta|m)$/i.test(mod))
      meta = true;
    else if (/^a(lt)?$/i.test(mod))
      alt = true;
    else if (/^(c|ctrl|control)$/i.test(mod))
      ctrl = true;
    else if (/^s(hift)?$/i.test(mod))
      shift2 = true;
    else if (/^mod$/i.test(mod)) {
      if (platform == "mac")
        meta = true;
      else
        ctrl = true;
    } else
      throw new Error("Unrecognized modifier name: " + mod);
  }
  if (alt)
    result = "Alt-" + result;
  if (ctrl)
    result = "Ctrl-" + result;
  if (meta)
    result = "Meta-" + result;
  if (shift2)
    result = "Shift-" + result;
  return result;
};
var modifiers = function(name, event, shift2) {
  if (event.altKey)
    name = "Alt-" + name;
  if (event.ctrlKey)
    name = "Ctrl-" + name;
  if (event.metaKey)
    name = "Meta-" + name;
  if (shift2 !== false && event.shiftKey)
    name = "Shift-" + name;
  return name;
};
var getKeymap = function(state2) {
  let bindings = state2.facet(keymap);
  let map = Keymaps.get(bindings);
  if (!map)
    Keymaps.set(bindings, map = buildKeymap(bindings.reduce((a, b) => a.concat(b), [])));
  return map;
};
var runScopeHandlers = function(view, event, scope) {
  return runHandlers(getKeymap(view.state), event, view, scope);
};
var buildKeymap = function(bindings, platform = currentPlatform) {
  let bound = Object.create(null);
  let isPrefix = Object.create(null);
  let checkPrefix = (name, is) => {
    let current = isPrefix[name];
    if (current == null)
      isPrefix[name] = is;
    else if (current != is)
      throw new Error("Key binding " + name + " is used both as a regular binding and as a multi-stroke prefix");
  };
  let add = (scope, key, command, preventDefault, stopPropagation) => {
    var _a, _b;
    let scopeObj = bound[scope] || (bound[scope] = Object.create(null));
    let parts = key.split(/ (?!$)/).map((k) => normalizeKeyName(k, platform));
    for (let i = 1;i < parts.length; i++) {
      let prefix = parts.slice(0, i).join(" ");
      checkPrefix(prefix, true);
      if (!scopeObj[prefix])
        scopeObj[prefix] = {
          preventDefault: true,
          stopPropagation: false,
          run: [(view) => {
            let ourObj = storedPrefix = { view, prefix, scope };
            setTimeout(() => {
              if (storedPrefix == ourObj)
                storedPrefix = null;
            }, PrefixTimeout);
            return true;
          }]
        };
    }
    let full = parts.join(" ");
    checkPrefix(full, false);
    let binding = scopeObj[full] || (scopeObj[full] = {
      preventDefault: false,
      stopPropagation: false,
      run: ((_b = (_a = scopeObj._any) === null || _a === undefined ? undefined : _a.run) === null || _b === undefined ? undefined : _b.slice()) || []
    });
    if (command)
      binding.run.push(command);
    if (preventDefault)
      binding.preventDefault = true;
    if (stopPropagation)
      binding.stopPropagation = true;
  };
  for (let b of bindings) {
    let scopes = b.scope ? b.scope.split(" ") : ["editor"];
    if (b.any)
      for (let scope of scopes) {
        let scopeObj = bound[scope] || (bound[scope] = Object.create(null));
        if (!scopeObj._any)
          scopeObj._any = { preventDefault: false, stopPropagation: false, run: [] };
        for (let key in scopeObj)
          scopeObj[key].run.push(b.any);
      }
    let name = b[platform] || b.key;
    if (!name)
      continue;
    for (let scope of scopes) {
      add(scope, name, b.run, b.preventDefault, b.stopPropagation);
      if (b.shift)
        add(scope, "Shift-" + name, b.shift, b.preventDefault, b.stopPropagation);
    }
  }
  return bound;
};
var runHandlers = function(map, event, view, scope) {
  let name = keyName(event);
  let charCode = codePointAt(name, 0), isChar = codePointSize(charCode) == name.length && name != " ";
  let prefix = "", handled = false, prevented = false, stopPropagation = false;
  if (storedPrefix && storedPrefix.view == view && storedPrefix.scope == scope) {
    prefix = storedPrefix.prefix + " ";
    if (modifierCodes.indexOf(event.keyCode) < 0) {
      prevented = true;
      storedPrefix = null;
    }
  }
  let ran = new Set;
  let runFor = (binding) => {
    if (binding) {
      for (let cmd of binding.run)
        if (!ran.has(cmd)) {
          ran.add(cmd);
          if (cmd(view, event)) {
            if (binding.stopPropagation)
              stopPropagation = true;
            return true;
          }
        }
      if (binding.preventDefault) {
        if (binding.stopPropagation)
          stopPropagation = true;
        prevented = true;
      }
    }
    return false;
  };
  let scopeObj = map[scope], baseName, shiftName;
  if (scopeObj) {
    if (runFor(scopeObj[prefix + modifiers(name, event, !isChar)])) {
      handled = true;
    } else if (isChar && (event.altKey || event.metaKey || event.ctrlKey) && !(browser.windows && event.ctrlKey && event.altKey) && (baseName = base[event.keyCode]) && baseName != name) {
      if (runFor(scopeObj[prefix + modifiers(baseName, event, true)])) {
        handled = true;
      } else if (event.shiftKey && (shiftName = shift[event.keyCode]) != name && shiftName != baseName && runFor(scopeObj[prefix + modifiers(shiftName, event, false)])) {
        handled = true;
      }
    } else if (isChar && event.shiftKey && runFor(scopeObj[prefix + modifiers(name, event, true)])) {
      handled = true;
    }
    if (!handled && runFor(scopeObj._any))
      handled = true;
  }
  if (prevented)
    handled = true;
  if (handled && stopPropagation)
    event.stopPropagation();
  return handled;
};
var getBase = function(view) {
  let rect = view.scrollDOM.getBoundingClientRect();
  let left = view.textDirection == Direction.LTR ? rect.left : rect.right - view.scrollDOM.clientWidth * view.scaleX;
  return { left: left - view.scrollDOM.scrollLeft * view.scaleX, top: rect.top - view.scrollDOM.scrollTop * view.scaleY };
};
var wrappedLine = function(view, pos, inside) {
  let range = EditorSelection.cursor(pos);
  return {
    from: Math.max(inside.from, view.moveToLineBoundary(range, false, true).from),
    to: Math.min(inside.to, view.moveToLineBoundary(range, true, true).from),
    type: BlockType.Text
  };
};
var rectanglesForRange = function(view, className, range) {
  if (range.to <= view.viewport.from || range.from >= view.viewport.to)
    return [];
  let from = Math.max(range.from, view.viewport.from), to = Math.min(range.to, view.viewport.to);
  let ltr = view.textDirection == Direction.LTR;
  let content = view.contentDOM, contentRect = content.getBoundingClientRect(), base2 = getBase(view);
  let lineElt = content.querySelector(".cm-line"), lineStyle = lineElt && window.getComputedStyle(lineElt);
  let leftSide = contentRect.left + (lineStyle ? parseInt(lineStyle.paddingLeft) + Math.min(0, parseInt(lineStyle.textIndent)) : 0);
  let rightSide = contentRect.right - (lineStyle ? parseInt(lineStyle.paddingRight) : 0);
  let startBlock = blockAt(view, from), endBlock = blockAt(view, to);
  let visualStart = startBlock.type == BlockType.Text ? startBlock : null;
  let visualEnd = endBlock.type == BlockType.Text ? endBlock : null;
  if (visualStart && (view.lineWrapping || startBlock.widgetLineBreaks))
    visualStart = wrappedLine(view, from, visualStart);
  if (visualEnd && (view.lineWrapping || endBlock.widgetLineBreaks))
    visualEnd = wrappedLine(view, to, visualEnd);
  if (visualStart && visualEnd && visualStart.from == visualEnd.from) {
    return pieces(drawForLine(range.from, range.to, visualStart));
  } else {
    let top2 = visualStart ? drawForLine(range.from, null, visualStart) : drawForWidget(startBlock, false);
    let bottom = visualEnd ? drawForLine(null, range.to, visualEnd) : drawForWidget(endBlock, true);
    let between = [];
    if ((visualStart || startBlock).to < (visualEnd || endBlock).from - (visualStart && visualEnd ? 1 : 0) || startBlock.widgetLineBreaks > 1 && top2.bottom + view.defaultLineHeight / 2 < bottom.top)
      between.push(piece(leftSide, top2.bottom, rightSide, bottom.top));
    else if (top2.bottom < bottom.top && view.elementAtHeight((top2.bottom + bottom.top) / 2).type == BlockType.Text)
      top2.bottom = bottom.top = (top2.bottom + bottom.top) / 2;
    return pieces(top2).concat(between).concat(pieces(bottom));
  }
  function piece(left, top2, right, bottom) {
    return new RectangleMarker(className, left - base2.left, top2 - base2.top - 0.01, right - left, bottom - top2 + 0.01);
  }
  function pieces({ top: top2, bottom, horizontal }) {
    let pieces2 = [];
    for (let i = 0;i < horizontal.length; i += 2)
      pieces2.push(piece(horizontal[i], top2, horizontal[i + 1], bottom));
    return pieces2;
  }
  function drawForLine(from2, to2, line) {
    let top2 = 1e9, bottom = -1e9, horizontal = [];
    function addSpan(from3, fromOpen, to3, toOpen, dir) {
      let fromCoords = view.coordsAtPos(from3, from3 == line.to ? -2 : 2);
      let toCoords = view.coordsAtPos(to3, to3 == line.from ? 2 : -2);
      if (!fromCoords || !toCoords)
        return;
      top2 = Math.min(fromCoords.top, toCoords.top, top2);
      bottom = Math.max(fromCoords.bottom, toCoords.bottom, bottom);
      if (dir == Direction.LTR)
        horizontal.push(ltr && fromOpen ? leftSide : fromCoords.left, ltr && toOpen ? rightSide : toCoords.right);
      else
        horizontal.push(!ltr && toOpen ? leftSide : toCoords.left, !ltr && fromOpen ? rightSide : fromCoords.right);
    }
    let start = from2 !== null && from2 !== undefined ? from2 : line.from, end = to2 !== null && to2 !== undefined ? to2 : line.to;
    for (let r of view.visibleRanges)
      if (r.to > start && r.from < end) {
        for (let pos = Math.max(r.from, start), endPos = Math.min(r.to, end);; ) {
          let docLine = view.state.doc.lineAt(pos);
          for (let span of view.bidiSpans(docLine)) {
            let spanFrom = span.from + docLine.from, spanTo = span.to + docLine.from;
            if (spanFrom >= endPos)
              break;
            if (spanTo > pos)
              addSpan(Math.max(spanFrom, pos), from2 == null && spanFrom <= start, Math.min(spanTo, endPos), to2 == null && spanTo >= end, span.dir);
          }
          pos = docLine.to + 1;
          if (pos >= endPos)
            break;
        }
      }
    if (horizontal.length == 0)
      addSpan(start, from2 == null, end, to2 == null, view.textDirection);
    return { top: top2, bottom, horizontal };
  }
  function drawForWidget(block, top2) {
    let y = contentRect.top + (top2 ? block.top : block.bottom);
    return { top: y, bottom: y, horizontal: [] };
  }
};
var sameMarker = function(a, b) {
  return a.constructor == b.constructor && a.eq(b);
};
var layer = function(config) {
  return [
    ViewPlugin.define((v) => new LayerView(v, config)),
    layerOrder.of(config)
  ];
};
var drawSelection = function(config = {}) {
  return [
    selectionConfig.of(config),
    cursorLayer,
    selectionLayer,
    hideNativeSelection,
    nativeSelectionHidden.of(true)
  ];
};
var configChanged = function(update) {
  return update.startState.facet(selectionConfig) != update.state.facet(selectionConfig);
};
var setBlinkRate = function(state2, dom) {
  dom.style.animationDuration = state2.facet(selectionConfig).cursorBlinkRate + "ms";
};
var dropCursor = function() {
  return [dropCursorPos, drawDropCursor];
};
var iterMatches = function(doc, re, from, to, f) {
  re.lastIndex = 0;
  for (let cursor = doc.iterRange(from, to), pos = from, m;!cursor.next().done; pos += cursor.value.length) {
    if (!cursor.lineBreak)
      while (m = re.exec(cursor.value))
        f(pos + m.index, m);
  }
};
var matchRanges = function(view, maxLength) {
  let visible = view.visibleRanges;
  if (visible.length == 1 && visible[0].from == view.viewport.from && visible[0].to == view.viewport.to)
    return visible;
  let result = [];
  for (let { from, to } of visible) {
    from = Math.max(view.state.doc.lineAt(from).from, from - maxLength);
    to = Math.min(view.state.doc.lineAt(to).to, to + maxLength);
    if (result.length && result[result.length - 1].to >= from)
      result[result.length - 1].to = to;
    else
      result.push({ from, to });
  }
  return result;
};
var supportsTabSize = function() {
  var _a;
  if (_supportsTabSize == null && typeof document != "undefined" && document.body) {
    let styles = document.body.style;
    _supportsTabSize = ((_a = styles.tabSize) !== null && _a !== undefined ? _a : styles.MozTabSize) != null;
  }
  return _supportsTabSize || false;
};
var highlightSpecialChars = function(config = {}) {
  return [specialCharConfig.of(config), specialCharPlugin()];
};
var specialCharPlugin = function() {
  return _plugin || (_plugin = ViewPlugin.fromClass(class {
    constructor(view) {
      this.view = view;
      this.decorations = Decoration.none;
      this.decorationCache = Object.create(null);
      this.decorator = this.makeDecorator(view.state.facet(specialCharConfig));
      this.decorations = this.decorator.createDeco(view);
    }
    makeDecorator(conf) {
      return new MatchDecorator({
        regexp: conf.specialChars,
        decoration: (m, view, pos) => {
          let { doc } = view.state;
          let code = codePointAt(m[0], 0);
          if (code == 9) {
            let line = doc.lineAt(pos);
            let size = view.state.tabSize, col = countColumn(line.text, size, pos - line.from);
            return Decoration.replace({
              widget: new TabWidget((size - col % size) * this.view.defaultCharacterWidth / this.view.scaleX)
            });
          }
          return this.decorationCache[code] || (this.decorationCache[code] = Decoration.replace({ widget: new SpecialCharWidget(conf, code) }));
        },
        boundary: conf.replaceTabs ? undefined : /[^]/
      });
    }
    update(update) {
      let conf = update.state.facet(specialCharConfig);
      if (update.startState.facet(specialCharConfig) != conf) {
        this.decorator = this.makeDecorator(conf);
        this.decorations = this.decorator.createDeco(update.view);
      } else {
        this.decorations = this.decorator.updateDeco(update, this.decorations);
      }
    }
  }, {
    decorations: (v) => v.decorations
  }));
};
var placeholder$1 = function(code) {
  if (code >= 32)
    return DefaultPlaceholder;
  if (code == 10)
    return "\u2424";
  return String.fromCharCode(9216 + code);
};
var highlightActiveLine = function() {
  return activeLineHighlighter;
};
var rectangleFor = function(state2, a, b) {
  let startLine = Math.min(a.line, b.line), endLine = Math.max(a.line, b.line);
  let ranges = [];
  if (a.off > MaxOff || b.off > MaxOff || a.col < 0 || b.col < 0) {
    let startOff = Math.min(a.off, b.off), endOff = Math.max(a.off, b.off);
    for (let i = startLine;i <= endLine; i++) {
      let line = state2.doc.line(i);
      if (line.length <= endOff)
        ranges.push(EditorSelection.range(line.from + startOff, line.to + endOff));
    }
  } else {
    let startCol = Math.min(a.col, b.col), endCol = Math.max(a.col, b.col);
    for (let i = startLine;i <= endLine; i++) {
      let line = state2.doc.line(i);
      let start = findColumn(line.text, startCol, state2.tabSize, true);
      if (start < 0) {
        ranges.push(EditorSelection.cursor(line.to));
      } else {
        let end = findColumn(line.text, endCol, state2.tabSize);
        ranges.push(EditorSelection.range(line.from + start, line.from + end));
      }
    }
  }
  return ranges;
};
var absoluteColumn = function(view, x) {
  let ref = view.coordsAtPos(view.viewport.from);
  return ref ? Math.round(Math.abs((ref.left - x) / view.defaultCharacterWidth)) : -1;
};
var getPos = function(view, event) {
  let offset = view.posAtCoords({ x: event.clientX, y: event.clientY }, false);
  let line = view.state.doc.lineAt(offset), off = offset - line.from;
  let col = off > MaxOff ? -1 : off == line.length ? absoluteColumn(view, event.clientX) : countColumn(line.text, view.state.tabSize, offset - line.from);
  return { line: line.number, col, off };
};
var rectangleSelectionStyle = function(view, event) {
  let start = getPos(view, event), startSel = view.state.selection;
  if (!start)
    return null;
  return {
    update(update) {
      if (update.docChanged) {
        let newStart = update.changes.mapPos(update.startState.doc.line(start.line).from);
        let newLine = update.state.doc.lineAt(newStart);
        start = { line: newLine.number, col: start.col, off: Math.min(start.off, newLine.length) };
        startSel = startSel.map(update.changes);
      }
    },
    get(event2, _extend, multiple) {
      let cur = getPos(view, event2);
      if (!cur)
        return startSel;
      let ranges = rectangleFor(view.state, start, cur);
      if (!ranges.length)
        return startSel;
      if (multiple)
        return EditorSelection.create(ranges.concat(startSel.ranges));
      else
        return EditorSelection.create(ranges);
    }
  };
};
var rectangularSelection = function(options) {
  let filter = (options === null || options === undefined ? undefined : options.eventFilter) || ((e) => e.altKey && e.button == 0);
  return EditorView.mouseSelectionStyle.of((view, event) => filter(event) ? rectangleSelectionStyle(view, event) : null);
};
var crosshairCursor = function(options = {}) {
  let [code, getter] = keys[options.key || "Alt"];
  let plugin = ViewPlugin.fromClass(class {
    constructor(view) {
      this.view = view;
      this.isDown = false;
    }
    set(isDown) {
      if (this.isDown != isDown) {
        this.isDown = isDown;
        this.view.update([]);
      }
    }
  }, {
    eventHandlers: {
      keydown(e) {
        this.set(e.keyCode == code || getter(e));
      },
      keyup(e) {
        if (e.keyCode == code || !getter(e))
          this.set(false);
      },
      mousemove(e) {
        this.set(getter(e));
      }
    }
  });
  return [
    plugin,
    EditorView.contentAttributes.of((view) => {
      var _a;
      return ((_a = view.plugin(plugin)) === null || _a === undefined ? undefined : _a.isDown) ? showCrosshair : null;
    })
  ];
};
var windowSpace = function(view) {
  let { win } = view;
  return { top: 0, left: 0, bottom: win.innerHeight, right: win.innerWidth };
};
var isInTooltip = function(elt) {
  for (let cur = elt;cur; cur = cur.parentNode)
    if (cur.nodeType == 1 && cur.classList.contains("cm-tooltip"))
      return true;
  return false;
};
var isOverRange = function(view, from, to, x, y, margin) {
  let rect = view.scrollDOM.getBoundingClientRect();
  let docBottom = view.documentTop + view.documentPadding.top + view.contentHeight;
  if (rect.left > x || rect.right < x || rect.top > y || Math.min(rect.bottom, docBottom) < y)
    return false;
  let pos = view.posAtCoords({ x, y }, false);
  return pos >= from && pos <= to;
};
var hoverTooltip = function(source, options = {}) {
  let setHover = StateEffect.define();
  let hoverState = StateField.define({
    create() {
      return null;
    },
    update(value, tr) {
      if (value && (options.hideOnChange && (tr.docChanged || tr.selection) || options.hideOn && options.hideOn(tr, value)))
        return null;
      if (value && tr.docChanged) {
        let newPos = tr.changes.mapPos(value.pos, -1, MapMode.TrackDel);
        if (newPos == null)
          return null;
        let copy = Object.assign(Object.create(null), value);
        copy.pos = newPos;
        if (value.end != null)
          copy.end = tr.changes.mapPos(value.end);
        value = copy;
      }
      for (let effect of tr.effects) {
        if (effect.is(setHover))
          value = effect.value;
        if (effect.is(closeHoverTooltipEffect))
          value = null;
      }
      return value;
    },
    provide: (f) => showHoverTooltip.from(f)
  });
  return [
    hoverState,
    ViewPlugin.define((view) => new HoverPlugin(view, source, hoverState, setHover, options.hoverTime || 300)),
    showHoverTooltipHost
  ];
};
var getTooltip = function(view, tooltip) {
  let plugin = view.plugin(tooltipPlugin);
  if (!plugin)
    return null;
  let found = plugin.manager.tooltips.indexOf(tooltip);
  return found < 0 ? null : plugin.manager.tooltipViews[found];
};
var getPanel = function(view, panel) {
  let plugin = view.plugin(panelPlugin);
  let index = plugin ? plugin.specs.indexOf(panel) : -1;
  return index > -1 ? plugin.panels[index] : null;
};
var rm = function(node) {
  let next = node.nextSibling;
  node.remove();
  return next;
};
var gutter = function(config) {
  return [gutters(), activeGutters.of(Object.assign(Object.assign({}, defaults), config))];
};
var gutters = function(config) {
  let result = [
    gutterView
  ];
  if (config && config.fixed === false)
    result.push(unfixGutters.of(true));
  return result;
};
var asArray2 = function(val) {
  return Array.isArray(val) ? val : [val];
};
var advanceCursor = function(cursor, collect, pos) {
  while (cursor.value && cursor.from <= pos) {
    if (cursor.from == pos)
      collect.push(cursor.value);
    cursor.next();
  }
};
var sameMarkers = function(a, b) {
  if (a.length != b.length)
    return false;
  for (let i = 0;i < a.length; i++)
    if (!a[i].compare(b[i]))
      return false;
  return true;
};
var formatNumber = function(view, number) {
  return view.state.facet(lineNumberConfig).formatNumber(number, view.state);
};
var lineNumbers = function(config = {}) {
  return [
    lineNumberConfig.of(config),
    gutters(),
    lineNumberGutter
  ];
};
var maxLineNumber = function(lines) {
  let last = 9;
  while (last < lines)
    last = last * 10 + 9;
  return last;
};
var highlightActiveLineGutter = function() {
  return activeLineGutterHighlighter;
};
class DOMSelectionState {
  constructor() {
    this.anchorNode = null;
    this.anchorOffset = 0;
    this.focusNode = null;
    this.focusOffset = 0;
  }
  eq(domSel) {
    return this.anchorNode == domSel.anchorNode && this.anchorOffset == domSel.anchorOffset && this.focusNode == domSel.focusNode && this.focusOffset == domSel.focusOffset;
  }
  setRange(range) {
    let { anchorNode, focusNode } = range;
    this.set(anchorNode, Math.min(range.anchorOffset, anchorNode ? maxOffset(anchorNode) : 0), focusNode, Math.min(range.focusOffset, focusNode ? maxOffset(focusNode) : 0));
  }
  set(anchorNode, anchorOffset, focusNode, focusOffset) {
    this.anchorNode = anchorNode;
    this.anchorOffset = anchorOffset;
    this.focusNode = focusNode;
    this.focusOffset = focusOffset;
  }
}
var preventScrollSupported = null;
var scratchRange;

class DOMPos {
  constructor(node, offset, precise = true) {
    this.node = node;
    this.offset = offset;
    this.precise = precise;
  }
  static before(dom, precise) {
    return new DOMPos(dom.parentNode, domIndex(dom), precise);
  }
  static after(dom, precise) {
    return new DOMPos(dom.parentNode, domIndex(dom) + 1, precise);
  }
}
var noChildren = [];

class ContentView {
  constructor() {
    this.parent = null;
    this.dom = null;
    this.flags = 2;
  }
  get overrideDOMText() {
    return null;
  }
  get posAtStart() {
    return this.parent ? this.parent.posBefore(this) : 0;
  }
  get posAtEnd() {
    return this.posAtStart + this.length;
  }
  posBefore(view) {
    let pos = this.posAtStart;
    for (let child of this.children) {
      if (child == view)
        return pos;
      pos += child.length + child.breakAfter;
    }
    throw new RangeError("Invalid child in posBefore");
  }
  posAfter(view) {
    return this.posBefore(view) + view.length;
  }
  sync(view, track) {
    if (this.flags & 2) {
      let parent = this.dom;
      let prev = null, next;
      for (let child of this.children) {
        if (child.flags & 7) {
          if (!child.dom && (next = prev ? prev.nextSibling : parent.firstChild)) {
            let contentView = ContentView.get(next);
            if (!contentView || !contentView.parent && contentView.canReuseDOM(child))
              child.reuseDOM(next);
          }
          child.sync(view, track);
          child.flags &= ~7;
        }
        next = prev ? prev.nextSibling : parent.firstChild;
        if (track && !track.written && track.node == parent && next != child.dom)
          track.written = true;
        if (child.dom.parentNode == parent) {
          while (next && next != child.dom)
            next = rm$1(next);
        } else {
          parent.insertBefore(child.dom, next);
        }
        prev = child.dom;
      }
      next = prev ? prev.nextSibling : parent.firstChild;
      if (next && track && track.node == parent)
        track.written = true;
      while (next)
        next = rm$1(next);
    } else if (this.flags & 1) {
      for (let child of this.children)
        if (child.flags & 7) {
          child.sync(view, track);
          child.flags &= ~7;
        }
    }
  }
  reuseDOM(_dom) {
  }
  localPosFromDOM(node, offset) {
    let after;
    if (node == this.dom) {
      after = this.dom.childNodes[offset];
    } else {
      let bias = maxOffset(node) == 0 ? 0 : offset == 0 ? -1 : 1;
      for (;; ) {
        let parent = node.parentNode;
        if (parent == this.dom)
          break;
        if (bias == 0 && parent.firstChild != parent.lastChild) {
          if (node == parent.firstChild)
            bias = -1;
          else
            bias = 1;
        }
        node = parent;
      }
      if (bias < 0)
        after = node;
      else
        after = node.nextSibling;
    }
    if (after == this.dom.firstChild)
      return 0;
    while (after && !ContentView.get(after))
      after = after.nextSibling;
    if (!after)
      return this.length;
    for (let i = 0, pos = 0;; i++) {
      let child = this.children[i];
      if (child.dom == after)
        return pos;
      pos += child.length + child.breakAfter;
    }
  }
  domBoundsAround(from, to, offset = 0) {
    let fromI = -1, fromStart = -1, toI = -1, toEnd = -1;
    for (let i = 0, pos = offset, prevEnd = offset;i < this.children.length; i++) {
      let child = this.children[i], end = pos + child.length;
      if (pos < from && end > to)
        return child.domBoundsAround(from, to, pos);
      if (end >= from && fromI == -1) {
        fromI = i;
        fromStart = pos;
      }
      if (pos > to && child.dom.parentNode == this.dom) {
        toI = i;
        toEnd = prevEnd;
        break;
      }
      prevEnd = end;
      pos = end + child.breakAfter;
    }
    return {
      from: fromStart,
      to: toEnd < 0 ? offset + this.length : toEnd,
      startDOM: (fromI ? this.children[fromI - 1].dom.nextSibling : null) || this.dom.firstChild,
      endDOM: toI < this.children.length && toI >= 0 ? this.children[toI].dom : null
    };
  }
  markDirty(andParent = false) {
    this.flags |= 2;
    this.markParentsDirty(andParent);
  }
  markParentsDirty(childList) {
    for (let parent = this.parent;parent; parent = parent.parent) {
      if (childList)
        parent.flags |= 2;
      if (parent.flags & 1)
        return;
      parent.flags |= 1;
      childList = false;
    }
  }
  setParent(parent) {
    if (this.parent != parent) {
      this.parent = parent;
      if (this.flags & 7)
        this.markParentsDirty(true);
    }
  }
  setDOM(dom) {
    if (this.dom == dom)
      return;
    if (this.dom)
      this.dom.cmView = null;
    this.dom = dom;
    dom.cmView = this;
  }
  get rootView() {
    for (let v = this;; ) {
      let parent = v.parent;
      if (!parent)
        return v;
      v = parent;
    }
  }
  replaceChildren(from, to, children = noChildren) {
    this.markDirty();
    for (let i = from;i < to; i++) {
      let child = this.children[i];
      if (child.parent == this)
        child.destroy();
    }
    this.children.splice(from, to - from, ...children);
    for (let i = 0;i < children.length; i++)
      children[i].setParent(this);
  }
  ignoreMutation(_rec) {
    return false;
  }
  ignoreEvent(_event) {
    return false;
  }
  childCursor(pos = this.length) {
    return new ChildCursor(this.children, pos, this.children.length);
  }
  childPos(pos, bias = 1) {
    return this.childCursor().findPos(pos, bias);
  }
  toString() {
    let name = this.constructor.name.replace("View", "");
    return name + (this.children.length ? "(" + this.children.join() + ")" : this.length ? "[" + (name == "Text" ? this.text : this.length) + "]" : "") + (this.breakAfter ? "#" : "");
  }
  static get(node) {
    return node.cmView;
  }
  get isEditable() {
    return true;
  }
  get isWidget() {
    return false;
  }
  get isHidden() {
    return false;
  }
  merge(from, to, source, hasStart, openStart, openEnd) {
    return false;
  }
  become(other) {
    return false;
  }
  canReuseDOM(other) {
    return other.constructor == this.constructor && !((this.flags | other.flags) & 8);
  }
  getSide() {
    return 0;
  }
  destroy() {
    this.parent = null;
  }
}
ContentView.prototype.breakAfter = 0;

class ChildCursor {
  constructor(children, pos, i) {
    this.children = children;
    this.pos = pos;
    this.i = i;
    this.off = 0;
  }
  findPos(pos, bias = 1) {
    for (;; ) {
      if (pos > this.pos || pos == this.pos && (bias > 0 || this.i == 0 || this.children[this.i - 1].breakAfter)) {
        this.off = pos - this.pos;
        return this;
      }
      let next = this.children[--this.i];
      this.pos -= next.length + next.breakAfter;
    }
  }
}
var nav = typeof navigator != "undefined" ? navigator : { userAgent: "", vendor: "", platform: "" };
var doc = typeof document != "undefined" ? document : { documentElement: { style: {} } };
var ie_edge = /Edge\/(\d+)/.exec(nav.userAgent);
var ie_upto10 = /MSIE \d/.test(nav.userAgent);
var ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(nav.userAgent);
var ie2 = !!(ie_upto10 || ie_11up || ie_edge);
var gecko = !ie2 && /gecko\/(\d+)/i.test(nav.userAgent);
var chrome = !ie2 && /Chrome\/(\d+)/.exec(nav.userAgent);
var webkit = "webkitFontSmoothing" in doc.documentElement.style;
var safari = !ie2 && /Apple Computer/.test(nav.vendor);
var ios = safari && (/Mobile\/\w+/.test(nav.userAgent) || nav.maxTouchPoints > 2);
var browser = {
  mac: ios || /Mac/.test(nav.platform),
  windows: /Win/.test(nav.platform),
  linux: /Linux|X11/.test(nav.platform),
  ie: ie2,
  ie_version: ie_upto10 ? doc.documentMode || 6 : ie_11up ? +ie_11up[1] : ie_edge ? +ie_edge[1] : 0,
  gecko,
  gecko_version: gecko ? +(/Firefox\/(\d+)/.exec(nav.userAgent) || [0, 0])[1] : 0,
  chrome: !!chrome,
  chrome_version: chrome ? +chrome[1] : 0,
  ios,
  android: /Android\b/.test(nav.userAgent),
  webkit,
  safari,
  webkit_version: webkit ? +(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1] : 0,
  tabSize: doc.documentElement.style.tabSize != null ? "tab-size" : "-moz-tab-size"
};
var MaxJoinLen = 256;

class TextView extends ContentView {
  constructor(text) {
    super();
    this.text = text;
  }
  get length() {
    return this.text.length;
  }
  createDOM(textDOM) {
    this.setDOM(textDOM || document.createTextNode(this.text));
  }
  sync(view, track) {
    if (!this.dom)
      this.createDOM();
    if (this.dom.nodeValue != this.text) {
      if (track && track.node == this.dom)
        track.written = true;
      this.dom.nodeValue = this.text;
    }
  }
  reuseDOM(dom) {
    if (dom.nodeType == 3)
      this.createDOM(dom);
  }
  merge(from, to, source) {
    if (this.flags & 8 || source && (!(source instanceof TextView) || this.length - (to - from) + source.length > MaxJoinLen || source.flags & 8))
      return false;
    this.text = this.text.slice(0, from) + (source ? source.text : "") + this.text.slice(to);
    this.markDirty();
    return true;
  }
  split(from) {
    let result = new TextView(this.text.slice(from));
    this.text = this.text.slice(0, from);
    this.markDirty();
    result.flags |= this.flags & 8;
    return result;
  }
  localPosFromDOM(node, offset) {
    return node == this.dom ? offset : offset ? this.text.length : 0;
  }
  domAtPos(pos) {
    return new DOMPos(this.dom, pos);
  }
  domBoundsAround(_from, _to, offset) {
    return { from: offset, to: offset + this.length, startDOM: this.dom, endDOM: this.dom.nextSibling };
  }
  coordsAt(pos, side) {
    return textCoords(this.dom, pos, side);
  }
}

class MarkView extends ContentView {
  constructor(mark, children = [], length = 0) {
    super();
    this.mark = mark;
    this.children = children;
    this.length = length;
    for (let ch of children)
      ch.setParent(this);
  }
  setAttrs(dom) {
    clearAttributes(dom);
    if (this.mark.class)
      dom.className = this.mark.class;
    if (this.mark.attrs)
      for (let name in this.mark.attrs)
        dom.setAttribute(name, this.mark.attrs[name]);
    return dom;
  }
  canReuseDOM(other) {
    return super.canReuseDOM(other) && !((this.flags | other.flags) & 8);
  }
  reuseDOM(node) {
    if (node.nodeName == this.mark.tagName.toUpperCase()) {
      this.setDOM(node);
      this.flags |= 4 | 2;
    }
  }
  sync(view, track) {
    if (!this.dom)
      this.setDOM(this.setAttrs(document.createElement(this.mark.tagName)));
    else if (this.flags & 4)
      this.setAttrs(this.dom);
    super.sync(view, track);
  }
  merge(from, to, source, _hasStart, openStart, openEnd) {
    if (source && (!(source instanceof MarkView && source.mark.eq(this.mark)) || from && openStart <= 0 || to < this.length && openEnd <= 0))
      return false;
    mergeChildrenInto(this, from, to, source ? source.children : [], openStart - 1, openEnd - 1);
    this.markDirty();
    return true;
  }
  split(from) {
    let result = [], off = 0, detachFrom = -1, i = 0;
    for (let elt of this.children) {
      let end = off + elt.length;
      if (end > from)
        result.push(off < from ? elt.split(from - off) : elt);
      if (detachFrom < 0 && off >= from)
        detachFrom = i;
      off = end;
      i++;
    }
    let length = this.length - from;
    this.length = from;
    if (detachFrom > -1) {
      this.children.length = detachFrom;
      this.markDirty();
    }
    return new MarkView(this.mark, result, length);
  }
  domAtPos(pos) {
    return inlineDOMAtPos(this, pos);
  }
  coordsAt(pos, side) {
    return coordsInChildren(this, pos, side);
  }
}

class WidgetView extends ContentView {
  static create(widget, length, side) {
    return new WidgetView(widget, length, side);
  }
  constructor(widget, length, side) {
    super();
    this.widget = widget;
    this.length = length;
    this.side = side;
    this.prevWidget = null;
  }
  split(from) {
    let result = WidgetView.create(this.widget, this.length - from, this.side);
    this.length -= from;
    return result;
  }
  sync(view) {
    if (!this.dom || !this.widget.updateDOM(this.dom, view)) {
      if (this.dom && this.prevWidget)
        this.prevWidget.destroy(this.dom);
      this.prevWidget = null;
      this.setDOM(this.widget.toDOM(view));
      this.dom.contentEditable = "false";
    }
  }
  getSide() {
    return this.side;
  }
  merge(from, to, source, hasStart, openStart, openEnd) {
    if (source && (!(source instanceof WidgetView) || !this.widget.compare(source.widget) || from > 0 && openStart <= 0 || to < this.length && openEnd <= 0))
      return false;
    this.length = from + (source ? source.length : 0) + (this.length - to);
    return true;
  }
  become(other) {
    if (other instanceof WidgetView && other.side == this.side && this.widget.constructor == other.widget.constructor) {
      if (!this.widget.compare(other.widget))
        this.markDirty(true);
      if (this.dom && !this.prevWidget)
        this.prevWidget = this.widget;
      this.widget = other.widget;
      this.length = other.length;
      return true;
    }
    return false;
  }
  ignoreMutation() {
    return true;
  }
  ignoreEvent(event) {
    return this.widget.ignoreEvent(event);
  }
  get overrideDOMText() {
    if (this.length == 0)
      return Text.empty;
    let top2 = this;
    while (top2.parent)
      top2 = top2.parent;
    let { view } = top2, text = view && view.state.doc, start = this.posAtStart;
    return text ? text.slice(start, start + this.length) : Text.empty;
  }
  domAtPos(pos) {
    return (this.length ? pos == 0 : this.side > 0) ? DOMPos.before(this.dom) : DOMPos.after(this.dom, pos == this.length);
  }
  domBoundsAround() {
    return null;
  }
  coordsAt(pos, side) {
    let custom = this.widget.coordsAt(this.dom, pos, side);
    if (custom)
      return custom;
    let rects = this.dom.getClientRects(), rect = null;
    if (!rects.length)
      return null;
    let fromBack = this.side ? this.side < 0 : pos > 0;
    for (let i = fromBack ? rects.length - 1 : 0;; i += fromBack ? -1 : 1) {
      rect = rects[i];
      if (pos > 0 ? i == 0 : i == rects.length - 1 || rect.top < rect.bottom)
        break;
    }
    return flattenRect(rect, !fromBack);
  }
  get isEditable() {
    return false;
  }
  get isWidget() {
    return true;
  }
  get isHidden() {
    return this.widget.isHidden;
  }
  destroy() {
    super.destroy();
    if (this.dom)
      this.widget.destroy(this.dom);
  }
}

class WidgetBufferView extends ContentView {
  constructor(side) {
    super();
    this.side = side;
  }
  get length() {
    return 0;
  }
  merge() {
    return false;
  }
  become(other) {
    return other instanceof WidgetBufferView && other.side == this.side;
  }
  split() {
    return new WidgetBufferView(this.side);
  }
  sync() {
    if (!this.dom) {
      let dom = document.createElement("img");
      dom.className = "cm-widgetBuffer";
      dom.setAttribute("aria-hidden", "true");
      this.setDOM(dom);
    }
  }
  getSide() {
    return this.side;
  }
  domAtPos(pos) {
    return this.side > 0 ? DOMPos.before(this.dom) : DOMPos.after(this.dom);
  }
  localPosFromDOM() {
    return 0;
  }
  domBoundsAround() {
    return null;
  }
  coordsAt(pos) {
    return this.dom.getBoundingClientRect();
  }
  get overrideDOMText() {
    return Text.empty;
  }
  get isHidden() {
    return true;
  }
}
TextView.prototype.children = WidgetView.prototype.children = WidgetBufferView.prototype.children = noChildren;
var noAttrs = Object.create(null);

class WidgetType {
  eq(widget) {
    return false;
  }
  updateDOM(dom, view) {
    return false;
  }
  compare(other) {
    return this == other || this.constructor == other.constructor && this.eq(other);
  }
  get estimatedHeight() {
    return -1;
  }
  get lineBreaks() {
    return 0;
  }
  ignoreEvent(event) {
    return true;
  }
  coordsAt(dom, pos, side) {
    return null;
  }
  get isHidden() {
    return false;
  }
  destroy(dom) {
  }
}
var BlockType = function(BlockType2) {
  BlockType2[BlockType2["Text"] = 0] = "Text";
  BlockType2[BlockType2["WidgetBefore"] = 1] = "WidgetBefore";
  BlockType2[BlockType2["WidgetAfter"] = 2] = "WidgetAfter";
  BlockType2[BlockType2["WidgetRange"] = 3] = "WidgetRange";
  return BlockType2;
}(BlockType || (BlockType = {}));

class Decoration extends RangeValue {
  constructor(startSide, endSide, widget, spec) {
    super();
    this.startSide = startSide;
    this.endSide = endSide;
    this.widget = widget;
    this.spec = spec;
  }
  get heightRelevant() {
    return false;
  }
  static mark(spec) {
    return new MarkDecoration(spec);
  }
  static widget(spec) {
    let side = Math.max(-1e4, Math.min(1e4, spec.side || 0)), block = !!spec.block;
    side += block && !spec.inlineOrder ? side > 0 ? 300000000 : -400000000 : side > 0 ? 1e8 : -1e8;
    return new PointDecoration(spec, side, side, block, spec.widget || null, false);
  }
  static replace(spec) {
    let block = !!spec.block, startSide, endSide;
    if (spec.isBlockGap) {
      startSide = -500000000;
      endSide = 400000000;
    } else {
      let { start, end } = getInclusive(spec, block);
      startSide = (start ? block ? -300000000 : -1 : 500000000) - 1;
      endSide = (end ? block ? 200000000 : 1 : -600000000) + 1;
    }
    return new PointDecoration(spec, startSide, endSide, block, spec.widget || null, true);
  }
  static line(spec) {
    return new LineDecoration(spec);
  }
  static set(of, sort = false) {
    return RangeSet.of(of, sort);
  }
  hasHeight() {
    return this.widget ? this.widget.estimatedHeight > -1 : false;
  }
}
Decoration.none = RangeSet.empty;

class MarkDecoration extends Decoration {
  constructor(spec) {
    let { start, end } = getInclusive(spec);
    super(start ? -1 : 500000000, end ? 1 : -600000000, null, spec);
    this.tagName = spec.tagName || "span";
    this.class = spec.class || "";
    this.attrs = spec.attributes || null;
  }
  eq(other) {
    var _a, _b;
    return this == other || other instanceof MarkDecoration && this.tagName == other.tagName && (this.class || ((_a = this.attrs) === null || _a === undefined ? undefined : _a.class)) == (other.class || ((_b = other.attrs) === null || _b === undefined ? undefined : _b.class)) && attrsEq(this.attrs, other.attrs, "class");
  }
  range(from, to = from) {
    if (from >= to)
      throw new RangeError("Mark decorations may not be empty");
    return super.range(from, to);
  }
}
MarkDecoration.prototype.point = false;

class LineDecoration extends Decoration {
  constructor(spec) {
    super(-200000000, -200000000, null, spec);
  }
  eq(other) {
    return other instanceof LineDecoration && this.spec.class == other.spec.class && attrsEq(this.spec.attributes, other.spec.attributes);
  }
  range(from, to = from) {
    if (to != from)
      throw new RangeError("Line decoration ranges must be zero-length");
    return super.range(from, to);
  }
}
LineDecoration.prototype.mapMode = MapMode.TrackBefore;
LineDecoration.prototype.point = true;

class PointDecoration extends Decoration {
  constructor(spec, startSide, endSide, block, widget, isReplace) {
    super(startSide, endSide, widget, spec);
    this.block = block;
    this.isReplace = isReplace;
    this.mapMode = !block ? MapMode.TrackDel : startSide <= 0 ? MapMode.TrackBefore : MapMode.TrackAfter;
  }
  get type() {
    return this.startSide < this.endSide ? BlockType.WidgetRange : this.startSide <= 0 ? BlockType.WidgetBefore : BlockType.WidgetAfter;
  }
  get heightRelevant() {
    return this.block || !!this.widget && (this.widget.estimatedHeight >= 5 || this.widget.lineBreaks > 0);
  }
  eq(other) {
    return other instanceof PointDecoration && widgetsEq(this.widget, other.widget) && this.block == other.block && this.startSide == other.startSide && this.endSide == other.endSide;
  }
  range(from, to = from) {
    if (this.isReplace && (from > to || from == to && this.startSide > 0 && this.endSide <= 0))
      throw new RangeError("Invalid range for replacement decoration");
    if (!this.isReplace && to != from)
      throw new RangeError("Widget decorations can only have zero-length ranges");
    return super.range(from, to);
  }
}
PointDecoration.prototype.point = true;

class LineView extends ContentView {
  constructor() {
    super(...arguments);
    this.children = [];
    this.length = 0;
    this.prevAttrs = undefined;
    this.attrs = null;
    this.breakAfter = 0;
  }
  merge(from, to, source, hasStart, openStart, openEnd) {
    if (source) {
      if (!(source instanceof LineView))
        return false;
      if (!this.dom)
        source.transferDOM(this);
    }
    if (hasStart)
      this.setDeco(source ? source.attrs : null);
    mergeChildrenInto(this, from, to, source ? source.children : [], openStart, openEnd);
    return true;
  }
  split(at) {
    let end = new LineView;
    end.breakAfter = this.breakAfter;
    if (this.length == 0)
      return end;
    let { i, off } = this.childPos(at);
    if (off) {
      end.append(this.children[i].split(off), 0);
      this.children[i].merge(off, this.children[i].length, null, false, 0, 0);
      i++;
    }
    for (let j = i;j < this.children.length; j++)
      end.append(this.children[j], 0);
    while (i > 0 && this.children[i - 1].length == 0)
      this.children[--i].destroy();
    this.children.length = i;
    this.markDirty();
    this.length = at;
    return end;
  }
  transferDOM(other) {
    if (!this.dom)
      return;
    this.markDirty();
    other.setDOM(this.dom);
    other.prevAttrs = this.prevAttrs === undefined ? this.attrs : this.prevAttrs;
    this.prevAttrs = undefined;
    this.dom = null;
  }
  setDeco(attrs) {
    if (!attrsEq(this.attrs, attrs)) {
      if (this.dom) {
        this.prevAttrs = this.attrs;
        this.markDirty();
      }
      this.attrs = attrs;
    }
  }
  append(child, openStart) {
    joinInlineInto(this, child, openStart);
  }
  addLineDeco(deco) {
    let attrs = deco.spec.attributes, cls = deco.spec.class;
    if (attrs)
      this.attrs = combineAttrs(attrs, this.attrs || {});
    if (cls)
      this.attrs = combineAttrs({ class: cls }, this.attrs || {});
  }
  domAtPos(pos) {
    return inlineDOMAtPos(this, pos);
  }
  reuseDOM(node) {
    if (node.nodeName == "DIV") {
      this.setDOM(node);
      this.flags |= 4 | 2;
    }
  }
  sync(view, track) {
    var _a;
    if (!this.dom) {
      this.setDOM(document.createElement("div"));
      this.dom.className = "cm-line";
      this.prevAttrs = this.attrs ? null : undefined;
    } else if (this.flags & 4) {
      clearAttributes(this.dom);
      this.dom.className = "cm-line";
      this.prevAttrs = this.attrs ? null : undefined;
    }
    if (this.prevAttrs !== undefined) {
      updateAttrs(this.dom, this.prevAttrs, this.attrs);
      this.dom.classList.add("cm-line");
      this.prevAttrs = undefined;
    }
    super.sync(view, track);
    let last = this.dom.lastChild;
    while (last && ContentView.get(last) instanceof MarkView)
      last = last.lastChild;
    if (!last || !this.length || last.nodeName != "BR" && ((_a = ContentView.get(last)) === null || _a === undefined ? undefined : _a.isEditable) == false && (!browser.ios || !this.children.some((ch) => ch instanceof TextView))) {
      let hack = document.createElement("BR");
      hack.cmIgnore = true;
      this.dom.appendChild(hack);
    }
  }
  measureTextSize() {
    if (this.children.length == 0 || this.length > 20)
      return null;
    let totalWidth = 0, textHeight;
    for (let child of this.children) {
      if (!(child instanceof TextView) || /[^ -~]/.test(child.text))
        return null;
      let rects = clientRectsFor(child.dom);
      if (rects.length != 1)
        return null;
      totalWidth += rects[0].width;
      textHeight = rects[0].height;
    }
    return !totalWidth ? null : {
      lineHeight: this.dom.getBoundingClientRect().height,
      charWidth: totalWidth / this.length,
      textHeight
    };
  }
  coordsAt(pos, side) {
    let rect = coordsInChildren(this, pos, side);
    if (!this.children.length && rect && this.parent) {
      let { heightOracle } = this.parent.view.viewState, height = rect.bottom - rect.top;
      if (Math.abs(height - heightOracle.lineHeight) < 2 && heightOracle.textHeight < height) {
        let dist2 = (height - heightOracle.textHeight) / 2;
        return { top: rect.top + dist2, bottom: rect.bottom - dist2, left: rect.left, right: rect.left };
      }
    }
    return rect;
  }
  become(_other) {
    return false;
  }
  get type() {
    return BlockType.Text;
  }
  static find(docView, pos) {
    for (let i = 0, off = 0;i < docView.children.length; i++) {
      let block = docView.children[i], end = off + block.length;
      if (end >= pos) {
        if (block instanceof LineView)
          return block;
        if (end > pos)
          break;
      }
      off = end + block.breakAfter;
    }
    return null;
  }
}

class BlockWidgetView extends ContentView {
  constructor(widget, length, type) {
    super();
    this.widget = widget;
    this.length = length;
    this.type = type;
    this.breakAfter = 0;
    this.prevWidget = null;
  }
  merge(from, to, source, _takeDeco, openStart, openEnd) {
    if (source && (!(source instanceof BlockWidgetView) || !this.widget.compare(source.widget) || from > 0 && openStart <= 0 || to < this.length && openEnd <= 0))
      return false;
    this.length = from + (source ? source.length : 0) + (this.length - to);
    return true;
  }
  domAtPos(pos) {
    return pos == 0 ? DOMPos.before(this.dom) : DOMPos.after(this.dom, pos == this.length);
  }
  split(at) {
    let len = this.length - at;
    this.length = at;
    let end = new BlockWidgetView(this.widget, len, this.type);
    end.breakAfter = this.breakAfter;
    return end;
  }
  get children() {
    return noChildren;
  }
  sync(view) {
    if (!this.dom || !this.widget.updateDOM(this.dom, view)) {
      if (this.dom && this.prevWidget)
        this.prevWidget.destroy(this.dom);
      this.prevWidget = null;
      this.setDOM(this.widget.toDOM(view));
      this.dom.contentEditable = "false";
    }
  }
  get overrideDOMText() {
    return this.parent ? this.parent.view.state.doc.slice(this.posAtStart, this.posAtEnd) : Text.empty;
  }
  domBoundsAround() {
    return null;
  }
  become(other) {
    if (other instanceof BlockWidgetView && other.widget.constructor == this.widget.constructor) {
      if (!other.widget.compare(this.widget))
        this.markDirty(true);
      if (this.dom && !this.prevWidget)
        this.prevWidget = this.widget;
      this.widget = other.widget;
      this.length = other.length;
      this.type = other.type;
      this.breakAfter = other.breakAfter;
      return true;
    }
    return false;
  }
  ignoreMutation() {
    return true;
  }
  ignoreEvent(event) {
    return this.widget.ignoreEvent(event);
  }
  get isEditable() {
    return false;
  }
  get isWidget() {
    return true;
  }
  coordsAt(pos, side) {
    return this.widget.coordsAt(this.dom, pos, side);
  }
  destroy() {
    super.destroy();
    if (this.dom)
      this.widget.destroy(this.dom);
  }
}

class ContentBuilder {
  constructor(doc2, pos, end, disallowBlockEffectsFor) {
    this.doc = doc2;
    this.pos = pos;
    this.end = end;
    this.disallowBlockEffectsFor = disallowBlockEffectsFor;
    this.content = [];
    this.curLine = null;
    this.breakAtStart = 0;
    this.pendingBuffer = 0;
    this.bufferMarks = [];
    this.atCursorPos = true;
    this.openStart = -1;
    this.openEnd = -1;
    this.text = "";
    this.textOff = 0;
    this.cursor = doc2.iter();
    this.skip = pos;
  }
  posCovered() {
    if (this.content.length == 0)
      return !this.breakAtStart && this.doc.lineAt(this.pos).from != this.pos;
    let last = this.content[this.content.length - 1];
    return !last.breakAfter && !(last instanceof BlockWidgetView && last.type == BlockType.WidgetBefore);
  }
  getLine() {
    if (!this.curLine) {
      this.content.push(this.curLine = new LineView);
      this.atCursorPos = true;
    }
    return this.curLine;
  }
  flushBuffer(active = this.bufferMarks) {
    if (this.pendingBuffer) {
      this.curLine.append(wrapMarks(new WidgetBufferView(-1), active), active.length);
      this.pendingBuffer = 0;
    }
  }
  addBlockWidget(view) {
    this.flushBuffer();
    this.curLine = null;
    this.content.push(view);
  }
  finish(openEnd) {
    if (this.pendingBuffer && openEnd <= this.bufferMarks.length)
      this.flushBuffer();
    else
      this.pendingBuffer = 0;
    if (!this.posCovered())
      this.getLine();
  }
  buildText(length, active, openStart) {
    while (length > 0) {
      if (this.textOff == this.text.length) {
        let { value, lineBreak, done } = this.cursor.next(this.skip);
        this.skip = 0;
        if (done)
          throw new Error("Ran out of text content when drawing inline views");
        if (lineBreak) {
          if (!this.posCovered())
            this.getLine();
          if (this.content.length)
            this.content[this.content.length - 1].breakAfter = 1;
          else
            this.breakAtStart = 1;
          this.flushBuffer();
          this.curLine = null;
          this.atCursorPos = true;
          length--;
          continue;
        } else {
          this.text = value;
          this.textOff = 0;
        }
      }
      let take = Math.min(this.text.length - this.textOff, length, 512);
      this.flushBuffer(active.slice(active.length - openStart));
      this.getLine().append(wrapMarks(new TextView(this.text.slice(this.textOff, this.textOff + take)), active), openStart);
      this.atCursorPos = true;
      this.textOff += take;
      length -= take;
      openStart = 0;
    }
  }
  span(from, to, active, openStart) {
    this.buildText(to - from, active, openStart);
    this.pos = to;
    if (this.openStart < 0)
      this.openStart = openStart;
  }
  point(from, to, deco, active, openStart, index) {
    if (this.disallowBlockEffectsFor[index] && deco instanceof PointDecoration) {
      if (deco.block)
        throw new RangeError("Block decorations may not be specified via plugins");
      if (to > this.doc.lineAt(this.pos).to)
        throw new RangeError("Decorations that replace line breaks may not be specified via plugins");
    }
    let len = to - from;
    if (deco instanceof PointDecoration) {
      if (deco.block) {
        let { type } = deco;
        if (type == BlockType.WidgetAfter && !this.posCovered())
          this.getLine();
        this.addBlockWidget(new BlockWidgetView(deco.widget || new NullWidget("div"), len, type));
      } else {
        let view = WidgetView.create(deco.widget || new NullWidget("span"), len, len ? 0 : deco.startSide);
        let cursorBefore = this.atCursorPos && !view.isEditable && openStart <= active.length && (from < to || deco.startSide > 0);
        let cursorAfter = !view.isEditable && (from < to || openStart > active.length || deco.startSide <= 0);
        let line = this.getLine();
        if (this.pendingBuffer == 2 && !cursorBefore && !view.isEditable)
          this.pendingBuffer = 0;
        this.flushBuffer(active);
        if (cursorBefore) {
          line.append(wrapMarks(new WidgetBufferView(1), active), openStart);
          openStart = active.length + Math.max(0, openStart - active.length);
        }
        line.append(wrapMarks(view, active), openStart);
        this.atCursorPos = cursorAfter;
        this.pendingBuffer = !cursorAfter ? 0 : from < to || openStart > active.length ? 1 : 2;
        if (this.pendingBuffer)
          this.bufferMarks = active.slice();
      }
    } else if (this.doc.lineAt(this.pos).from == this.pos) {
      this.getLine().addLineDeco(deco);
    }
    if (len) {
      if (this.textOff + len <= this.text.length) {
        this.textOff += len;
      } else {
        this.skip += len - (this.text.length - this.textOff);
        this.text = "";
        this.textOff = 0;
      }
      this.pos = to;
    }
    if (this.openStart < 0)
      this.openStart = openStart;
  }
  static build(text, from, to, decorations, dynamicDecorationMap) {
    let builder = new ContentBuilder(text, from, to, dynamicDecorationMap);
    builder.openEnd = RangeSet.spans(decorations, from, to, builder);
    if (builder.openStart < 0)
      builder.openStart = builder.openEnd;
    builder.finish(builder.openEnd);
    return builder;
  }
}

class NullWidget extends WidgetType {
  constructor(tag) {
    super();
    this.tag = tag;
  }
  eq(other) {
    return other.tag == this.tag;
  }
  toDOM() {
    return document.createElement(this.tag);
  }
  updateDOM(elt) {
    return elt.nodeName.toLowerCase() == this.tag;
  }
  get isHidden() {
    return true;
  }
}
var clickAddsSelectionRange = Facet.define();
var dragMovesSelection$1 = Facet.define();
var mouseSelectionStyle = Facet.define();
var exceptionSink = Facet.define();
var updateListener = Facet.define();
var inputHandler = Facet.define();
var focusChangeEffect = Facet.define();
var perLineTextDirection = Facet.define({
  combine: (values) => values.some((x) => x)
});
var nativeSelectionHidden = Facet.define({
  combine: (values) => values.some((x) => x)
});

class ScrollTarget {
  constructor(range, y = "nearest", x = "nearest", yMargin = 5, xMargin = 5) {
    this.range = range;
    this.y = y;
    this.x = x;
    this.yMargin = yMargin;
    this.xMargin = xMargin;
  }
  map(changes) {
    return changes.empty ? this : new ScrollTarget(this.range.map(changes), this.y, this.x, this.yMargin, this.xMargin);
  }
}
var scrollIntoView = StateEffect.define({ map: (t, ch) => t.map(ch) });
var editable = Facet.define({ combine: (values) => values.length ? values[0] : true });
var nextPluginID = 0;
var viewPlugin = Facet.define();

class ViewPlugin {
  constructor(id, create, domEventHandlers, buildExtensions) {
    this.id = id;
    this.create = create;
    this.domEventHandlers = domEventHandlers;
    this.extension = buildExtensions(this);
  }
  static define(create, spec) {
    const { eventHandlers, provide, decorations: deco } = spec || {};
    return new ViewPlugin(nextPluginID++, create, eventHandlers, (plugin) => {
      let ext = [viewPlugin.of(plugin)];
      if (deco)
        ext.push(decorations.of((view) => {
          let pluginInst = view.plugin(plugin);
          return pluginInst ? deco(pluginInst) : Decoration.none;
        }));
      if (provide)
        ext.push(provide(plugin));
      return ext;
    });
  }
  static fromClass(cls, spec) {
    return ViewPlugin.define((view) => new cls(view), spec);
  }
}

class PluginInstance {
  constructor(spec) {
    this.spec = spec;
    this.mustUpdate = null;
    this.value = null;
  }
  update(view) {
    if (!this.value) {
      if (this.spec) {
        try {
          this.value = this.spec.create(view);
        } catch (e) {
          logException(view.state, e, "CodeMirror plugin crashed");
          this.deactivate();
        }
      }
    } else if (this.mustUpdate) {
      let update = this.mustUpdate;
      this.mustUpdate = null;
      if (this.value.update) {
        try {
          this.value.update(update);
        } catch (e) {
          logException(update.state, e, "CodeMirror plugin crashed");
          if (this.value.destroy)
            try {
              this.value.destroy();
            } catch (_) {
            }
          this.deactivate();
        }
      }
    }
    return this;
  }
  destroy(view) {
    var _a;
    if ((_a = this.value) === null || _a === undefined ? undefined : _a.destroy) {
      try {
        this.value.destroy();
      } catch (e) {
        logException(view.state, e, "CodeMirror plugin crashed");
      }
    }
  }
  deactivate() {
    this.spec = this.value = null;
  }
}
var editorAttributes = Facet.define();
var contentAttributes = Facet.define();
var decorations = Facet.define();
var atomicRanges = Facet.define();
var bidiIsolatedRanges = Facet.define();
var scrollMargins = Facet.define();
var styleModule = Facet.define();

class ChangedRange {
  constructor(fromA, toA, fromB, toB) {
    this.fromA = fromA;
    this.toA = toA;
    this.fromB = fromB;
    this.toB = toB;
  }
  join(other) {
    return new ChangedRange(Math.min(this.fromA, other.fromA), Math.max(this.toA, other.toA), Math.min(this.fromB, other.fromB), Math.max(this.toB, other.toB));
  }
  addToSet(set) {
    let i = set.length, me = this;
    for (;i > 0; i--) {
      let range = set[i - 1];
      if (range.fromA > me.toA)
        continue;
      if (range.toA < me.fromA)
        break;
      me = me.join(range);
      set.splice(i - 1, 1);
    }
    set.splice(i, 0, me);
    return set;
  }
  static extendWithRanges(diff, ranges) {
    if (ranges.length == 0)
      return diff;
    let result = [];
    for (let dI = 0, rI = 0, posA = 0, posB = 0;; dI++) {
      let next = dI == diff.length ? null : diff[dI], off = posA - posB;
      let end = next ? next.fromB : 1e9;
      while (rI < ranges.length && ranges[rI] < end) {
        let from = ranges[rI], to = ranges[rI + 1];
        let fromB = Math.max(posB, from), toB = Math.min(end, to);
        if (fromB <= toB)
          new ChangedRange(fromB + off, toB + off, fromB, toB).addToSet(result);
        if (to > end)
          break;
        else
          rI += 2;
      }
      if (!next)
        return result;
      new ChangedRange(next.fromA, next.toA, next.fromB, next.toB).addToSet(result);
      posA = next.toA;
      posB = next.toB;
    }
  }
}

class ViewUpdate {
  constructor(view, state2, transactions) {
    this.view = view;
    this.state = state2;
    this.transactions = transactions;
    this.flags = 0;
    this.startState = view.state;
    this.changes = ChangeSet.empty(this.startState.doc.length);
    for (let tr of transactions)
      this.changes = this.changes.compose(tr.changes);
    let changedRanges = [];
    this.changes.iterChangedRanges((fromA, toA, fromB, toB) => changedRanges.push(new ChangedRange(fromA, toA, fromB, toB)));
    this.changedRanges = changedRanges;
  }
  static create(view, state2, transactions) {
    return new ViewUpdate(view, state2, transactions);
  }
  get viewportChanged() {
    return (this.flags & 4) > 0;
  }
  get heightChanged() {
    return (this.flags & 2) > 0;
  }
  get geometryChanged() {
    return this.docChanged || (this.flags & (8 | 2)) > 0;
  }
  get focusChanged() {
    return (this.flags & 1) > 0;
  }
  get docChanged() {
    return !this.changes.empty;
  }
  get selectionSet() {
    return this.transactions.some((tr) => tr.selection);
  }
  get empty() {
    return this.flags == 0 && this.transactions.length == 0;
  }
}
var Direction = function(Direction2) {
  Direction2[Direction2["LTR"] = 0] = "LTR";
  Direction2[Direction2["RTL"] = 1] = "RTL";
  return Direction2;
}(Direction || (Direction = {}));
var LTR = Direction.LTR;
var RTL = Direction.RTL;
var LowTypes = dec("88888888888888888888888888888888888666888888787833333333337888888000000000000000000000000008888880000000000000000000000000088888888888888888888888888888888888887866668888088888663380888308888800000000000000000000000800000000000000000000000000000008");
var ArabicTypes = dec("4444448826627288999999999992222222222222222222222222222222222222222222222229999999999999999999994444444444644222822222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222999999949999999229989999223333333333");
var Brackets = Object.create(null);
var BracketStack = [];
for (let p of ["()", "[]", "{}"]) {
  let l = p.charCodeAt(0), r = p.charCodeAt(1);
  Brackets[l] = r;
  Brackets[r] = -l;
}
var BidiRE = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac\ufb50-\ufdff]/;

class BidiSpan {
  get dir() {
    return this.level % 2 ? RTL : LTR;
  }
  constructor(from, to, level) {
    this.from = from;
    this.to = to;
    this.level = level;
  }
  side(end, dir) {
    return this.dir == dir == end ? this.to : this.from;
  }
  static find(order, index, level, assoc) {
    let maybe = -1;
    for (let i = 0;i < order.length; i++) {
      let span = order[i];
      if (span.from <= index && span.to >= index) {
        if (span.level == level)
          return i;
        if (maybe < 0 || (assoc != 0 ? assoc < 0 ? span.from < index : span.to > index : order[maybe].level > span.level))
          maybe = i;
      }
    }
    if (maybe < 0)
      throw new RangeError("Index out of range");
    return maybe;
  }
}
var types = [];
var movedOver = "";

class DocView extends ContentView {
  get length() {
    return this.view.state.doc.length;
  }
  constructor(view) {
    super();
    this.view = view;
    this.decorations = [];
    this.dynamicDecorationMap = [];
    this.domChanged = null;
    this.hasComposition = null;
    this.markedForComposition = new Set;
    this.minWidth = 0;
    this.minWidthFrom = 0;
    this.minWidthTo = 0;
    this.impreciseAnchor = null;
    this.impreciseHead = null;
    this.forceSelection = false;
    this.lastUpdate = Date.now();
    this.setDOM(view.contentDOM);
    this.children = [new LineView];
    this.children[0].setParent(this);
    this.updateDeco();
    this.updateInner([new ChangedRange(0, 0, 0, view.state.doc.length)], 0, null);
  }
  update(update) {
    var _a;
    let changedRanges = update.changedRanges;
    if (this.minWidth > 0 && changedRanges.length) {
      if (!changedRanges.every(({ fromA, toA }) => toA < this.minWidthFrom || fromA > this.minWidthTo)) {
        this.minWidth = this.minWidthFrom = this.minWidthTo = 0;
      } else {
        this.minWidthFrom = update.changes.mapPos(this.minWidthFrom, 1);
        this.minWidthTo = update.changes.mapPos(this.minWidthTo, 1);
      }
    }
    let readCompositionAt = -1;
    if (this.view.inputState.composing >= 0) {
      if ((_a = this.domChanged) === null || _a === undefined ? undefined : _a.newSel)
        readCompositionAt = this.domChanged.newSel.head;
      else if (!touchesComposition(update.changes, this.hasComposition) && !update.selectionSet)
        readCompositionAt = update.state.selection.main.head;
    }
    let composition = readCompositionAt > -1 ? findCompositionRange(this.view, update.changes, readCompositionAt) : null;
    this.domChanged = null;
    if (this.hasComposition) {
      this.markedForComposition.clear();
      let { from, to } = this.hasComposition;
      changedRanges = new ChangedRange(from, to, update.changes.mapPos(from, -1), update.changes.mapPos(to, 1)).addToSet(changedRanges.slice());
    }
    this.hasComposition = composition ? { from: composition.range.fromB, to: composition.range.toB } : null;
    if ((browser.ie || browser.chrome) && !composition && update && update.state.doc.lines != update.startState.doc.lines)
      this.forceSelection = true;
    let prevDeco = this.decorations, deco = this.updateDeco();
    let decoDiff = findChangedDeco(prevDeco, deco, update.changes);
    changedRanges = ChangedRange.extendWithRanges(changedRanges, decoDiff);
    if (!(this.flags & 7) && changedRanges.length == 0) {
      return false;
    } else {
      this.updateInner(changedRanges, update.startState.doc.length, composition);
      if (update.transactions.length)
        this.lastUpdate = Date.now();
      return true;
    }
  }
  updateInner(changes, oldLength, composition) {
    this.view.viewState.mustMeasureContent = true;
    this.updateChildren(changes, oldLength, composition);
    let { observer } = this.view;
    observer.ignore(() => {
      this.dom.style.height = this.view.viewState.contentHeight / this.view.scaleY + "px";
      this.dom.style.flexBasis = this.minWidth ? this.minWidth + "px" : "";
      let track = browser.chrome || browser.ios ? { node: observer.selectionRange.focusNode, written: false } : undefined;
      this.sync(this.view, track);
      this.flags &= ~7;
      if (track && (track.written || observer.selectionRange.focusNode != track.node))
        this.forceSelection = true;
      this.dom.style.height = "";
    });
    this.markedForComposition.forEach((cView) => cView.flags &= ~8);
    let gaps = [];
    if (this.view.viewport.from || this.view.viewport.to < this.view.state.doc.length) {
      for (let child of this.children)
        if (child instanceof BlockWidgetView && child.widget instanceof BlockGapWidget)
          gaps.push(child.dom);
    }
    observer.updateGaps(gaps);
  }
  updateChildren(changes, oldLength, composition) {
    let ranges = composition ? composition.range.addToSet(changes.slice()) : changes;
    let cursor = this.childCursor(oldLength);
    for (let i = ranges.length - 1;; i--) {
      let next = i >= 0 ? ranges[i] : null;
      if (!next)
        break;
      let { fromA, toA, fromB, toB } = next, content, breakAtStart, openStart, openEnd;
      if (composition && composition.range.fromB < toB && composition.range.toB > fromB) {
        let before = ContentBuilder.build(this.view.state.doc, fromB, composition.range.fromB, this.decorations, this.dynamicDecorationMap);
        let after = ContentBuilder.build(this.view.state.doc, composition.range.toB, toB, this.decorations, this.dynamicDecorationMap);
        breakAtStart = before.breakAtStart;
        openStart = before.openStart;
        openEnd = after.openEnd;
        let compLine = this.compositionView(composition);
        if (after.breakAtStart) {
          compLine.breakAfter = 1;
        } else if (after.content.length && compLine.merge(compLine.length, compLine.length, after.content[0], false, after.openStart, 0)) {
          compLine.breakAfter = after.content[0].breakAfter;
          after.content.shift();
        }
        if (before.content.length && compLine.merge(0, 0, before.content[before.content.length - 1], true, 0, before.openEnd)) {
          before.content.pop();
        }
        content = before.content.concat(compLine).concat(after.content);
      } else {
        ({ content, breakAtStart, openStart, openEnd } = ContentBuilder.build(this.view.state.doc, fromB, toB, this.decorations, this.dynamicDecorationMap));
      }
      let { i: toI, off: toOff } = cursor.findPos(toA, 1);
      let { i: fromI, off: fromOff } = cursor.findPos(fromA, -1);
      replaceRange(this, fromI, fromOff, toI, toOff, content, breakAtStart, openStart, openEnd);
    }
    if (composition)
      this.fixCompositionDOM(composition);
  }
  compositionView(composition) {
    let cur = new TextView(composition.text.nodeValue);
    cur.flags |= 8;
    for (let { deco } of composition.marks)
      cur = new MarkView(deco, [cur], cur.length);
    let line = new LineView;
    line.append(cur, 0);
    return line;
  }
  fixCompositionDOM(composition) {
    let fix = (dom, cView2) => {
      cView2.flags |= 8 | (cView2.children.some((c) => c.flags & 7) ? 1 : 0);
      this.markedForComposition.add(cView2);
      let prev = ContentView.get(dom);
      if (prev && prev != cView2)
        prev.dom = null;
      cView2.setDOM(dom);
    };
    let pos = this.childPos(composition.range.fromB, 1);
    let cView = this.children[pos.i];
    fix(composition.line, cView);
    for (let i = composition.marks.length - 1;i >= -1; i--) {
      pos = cView.childPos(pos.off, 1);
      cView = cView.children[pos.i];
      fix(i >= 0 ? composition.marks[i].node : composition.text, cView);
    }
  }
  updateSelection(mustRead = false, fromPointer = false) {
    if (mustRead || !this.view.observer.selectionRange.focusNode)
      this.view.observer.readSelectionRange();
    let activeElt = this.view.root.activeElement, focused = activeElt == this.dom;
    let selectionNotFocus = !focused && hasSelection(this.dom, this.view.observer.selectionRange) && !(activeElt && this.dom.contains(activeElt));
    if (!(focused || fromPointer || selectionNotFocus))
      return;
    let force = this.forceSelection;
    this.forceSelection = false;
    let main = this.view.state.selection.main;
    let anchor = this.moveToLine(this.domAtPos(main.anchor));
    let head = main.empty ? anchor : this.moveToLine(this.domAtPos(main.head));
    if (browser.gecko && main.empty && !this.hasComposition && betweenUneditable(anchor)) {
      let dummy = document.createTextNode("");
      this.view.observer.ignore(() => anchor.node.insertBefore(dummy, anchor.node.childNodes[anchor.offset] || null));
      anchor = head = new DOMPos(dummy, 0);
      force = true;
    }
    let domSel = this.view.observer.selectionRange;
    if (force || !domSel.focusNode || !isEquivalentPosition(anchor.node, anchor.offset, domSel.anchorNode, domSel.anchorOffset) || !isEquivalentPosition(head.node, head.offset, domSel.focusNode, domSel.focusOffset)) {
      this.view.observer.ignore(() => {
        if (browser.android && browser.chrome && this.dom.contains(domSel.focusNode) && inUneditable(domSel.focusNode, this.dom)) {
          this.dom.blur();
          this.dom.focus({ preventScroll: true });
        }
        let rawSel = getSelection(this.view.root);
        if (!rawSel)
          ;
        else if (main.empty) {
          if (browser.gecko) {
            let nextTo = nextToUneditable(anchor.node, anchor.offset);
            if (nextTo && nextTo != (1 | 2)) {
              let text = nearbyTextNode(anchor.node, anchor.offset, nextTo == 1 ? 1 : -1);
              if (text)
                anchor = new DOMPos(text.node, text.offset);
            }
          }
          rawSel.collapse(anchor.node, anchor.offset);
          if (main.bidiLevel != null && rawSel.caretBidiLevel !== undefined)
            rawSel.caretBidiLevel = main.bidiLevel;
        } else if (rawSel.extend) {
          rawSel.collapse(anchor.node, anchor.offset);
          try {
            rawSel.extend(head.node, head.offset);
          } catch (_) {
          }
        } else {
          let range = document.createRange();
          if (main.anchor > main.head)
            [anchor, head] = [head, anchor];
          range.setEnd(head.node, head.offset);
          range.setStart(anchor.node, anchor.offset);
          rawSel.removeAllRanges();
          rawSel.addRange(range);
        }
        if (selectionNotFocus && this.view.root.activeElement == this.dom) {
          this.dom.blur();
          if (activeElt)
            activeElt.focus();
        }
      });
      this.view.observer.setSelectionRange(anchor, head);
    }
    this.impreciseAnchor = anchor.precise ? null : new DOMPos(domSel.anchorNode, domSel.anchorOffset);
    this.impreciseHead = head.precise ? null : new DOMPos(domSel.focusNode, domSel.focusOffset);
  }
  enforceCursorAssoc() {
    if (this.hasComposition)
      return;
    let { view } = this, cursor = view.state.selection.main;
    let sel = getSelection(view.root);
    let { anchorNode, anchorOffset } = view.observer.selectionRange;
    if (!sel || !cursor.empty || !cursor.assoc || !sel.modify)
      return;
    let line = LineView.find(this, cursor.head);
    if (!line)
      return;
    let lineStart = line.posAtStart;
    if (cursor.head == lineStart || cursor.head == lineStart + line.length)
      return;
    let before = this.coordsAt(cursor.head, -1), after = this.coordsAt(cursor.head, 1);
    if (!before || !after || before.bottom > after.top)
      return;
    let dom = this.domAtPos(cursor.head + cursor.assoc);
    sel.collapse(dom.node, dom.offset);
    sel.modify("move", cursor.assoc < 0 ? "forward" : "backward", "lineboundary");
    view.observer.readSelectionRange();
    let newRange = view.observer.selectionRange;
    if (view.docView.posFromDOM(newRange.anchorNode, newRange.anchorOffset) != cursor.from)
      sel.collapse(anchorNode, anchorOffset);
  }
  moveToLine(pos) {
    let dom = this.dom, newPos;
    if (pos.node != dom)
      return pos;
    for (let i = pos.offset;!newPos && i < dom.childNodes.length; i++) {
      let view = ContentView.get(dom.childNodes[i]);
      if (view instanceof LineView)
        newPos = view.domAtPos(0);
    }
    for (let i = pos.offset - 1;!newPos && i >= 0; i--) {
      let view = ContentView.get(dom.childNodes[i]);
      if (view instanceof LineView)
        newPos = view.domAtPos(view.length);
    }
    return newPos ? new DOMPos(newPos.node, newPos.offset, true) : pos;
  }
  nearest(dom) {
    for (let cur = dom;cur; ) {
      let domView = ContentView.get(cur);
      if (domView && domView.rootView == this)
        return domView;
      cur = cur.parentNode;
    }
    return null;
  }
  posFromDOM(node, offset) {
    let view = this.nearest(node);
    if (!view)
      throw new RangeError("Trying to find position for a DOM position outside of the document");
    return view.localPosFromDOM(node, offset) + view.posAtStart;
  }
  domAtPos(pos) {
    let { i, off } = this.childCursor().findPos(pos, -1);
    for (;i < this.children.length - 1; ) {
      let child = this.children[i];
      if (off < child.length || child instanceof LineView)
        break;
      i++;
      off = 0;
    }
    return this.children[i].domAtPos(off);
  }
  coordsAt(pos, side) {
    for (let off = this.length, i = this.children.length - 1;; i--) {
      let child = this.children[i], start = off - child.breakAfter - child.length;
      if (pos > start || pos == start && child.type != BlockType.WidgetBefore && child.type != BlockType.WidgetAfter && (!i || side == 2 || this.children[i - 1].breakAfter || this.children[i - 1].type == BlockType.WidgetBefore && side > -2))
        return child.coordsAt(pos - start, side);
      off = start;
    }
  }
  coordsForChar(pos) {
    let { i, off } = this.childPos(pos, 1), child = this.children[i];
    if (!(child instanceof LineView))
      return null;
    while (child.children.length) {
      let { i: i2, off: childOff } = child.childPos(off, 1);
      for (;; i2++) {
        if (i2 == child.children.length)
          return null;
        if ((child = child.children[i2]).length)
          break;
      }
      off = childOff;
    }
    if (!(child instanceof TextView))
      return null;
    let end = findClusterBreak(child.text, off);
    if (end == off)
      return null;
    let rects = textRange(child.dom, off, end).getClientRects();
    return !rects.length || rects[0].top >= rects[0].bottom ? null : rects[0];
  }
  measureVisibleLineHeights(viewport) {
    let result = [], { from, to } = viewport;
    let contentWidth = this.view.contentDOM.clientWidth;
    let isWider = contentWidth > Math.max(this.view.scrollDOM.clientWidth, this.minWidth) + 1;
    let widest = -1, ltr = this.view.textDirection == Direction.LTR;
    for (let pos = 0, i = 0;i < this.children.length; i++) {
      let child = this.children[i], end = pos + child.length;
      if (end > to)
        break;
      if (pos >= from) {
        let childRect = child.dom.getBoundingClientRect();
        result.push(childRect.height);
        if (isWider) {
          let last = child.dom.lastChild;
          let rects = last ? clientRectsFor(last) : [];
          if (rects.length) {
            let rect = rects[rects.length - 1];
            let width = ltr ? rect.right - childRect.left : childRect.right - rect.left;
            if (width > widest) {
              widest = width;
              this.minWidth = contentWidth;
              this.minWidthFrom = pos;
              this.minWidthTo = end;
            }
          }
        }
      }
      pos = end + child.breakAfter;
    }
    return result;
  }
  textDirectionAt(pos) {
    let { i } = this.childPos(pos, 1);
    return getComputedStyle(this.children[i].dom).direction == "rtl" ? Direction.RTL : Direction.LTR;
  }
  measureTextSize() {
    for (let child of this.children) {
      if (child instanceof LineView) {
        let measure = child.measureTextSize();
        if (measure)
          return measure;
      }
    }
    let dummy = document.createElement("div"), lineHeight, charWidth, textHeight;
    dummy.className = "cm-line";
    dummy.style.width = "99999px";
    dummy.style.position = "absolute";
    dummy.textContent = "abc def ghi jkl mno pqr stu";
    this.view.observer.ignore(() => {
      this.dom.appendChild(dummy);
      let rect = clientRectsFor(dummy.firstChild)[0];
      lineHeight = dummy.getBoundingClientRect().height;
      charWidth = rect ? rect.width / 27 : 7;
      textHeight = rect ? rect.height : lineHeight;
      dummy.remove();
    });
    return { lineHeight, charWidth, textHeight };
  }
  childCursor(pos = this.length) {
    let i = this.children.length;
    if (i)
      pos -= this.children[--i].length;
    return new ChildCursor(this.children, pos, i);
  }
  computeBlockGapDeco() {
    let deco = [], vs = this.view.viewState;
    for (let pos = 0, i = 0;; i++) {
      let next = i == vs.viewports.length ? null : vs.viewports[i];
      let end = next ? next.from - 1 : this.length;
      if (end > pos) {
        let height = (vs.lineBlockAt(end).bottom - vs.lineBlockAt(pos).top) / this.view.scaleY;
        deco.push(Decoration.replace({
          widget: new BlockGapWidget(height),
          block: true,
          inclusive: true,
          isBlockGap: true
        }).range(pos, end));
      }
      if (!next)
        break;
      pos = next.to + 1;
    }
    return Decoration.set(deco);
  }
  updateDeco() {
    let allDeco = this.view.state.facet(decorations).map((d, i) => {
      let dynamic = this.dynamicDecorationMap[i] = typeof d == "function";
      return dynamic ? d(this.view) : d;
    });
    for (let i = allDeco.length;i < allDeco.length + 3; i++)
      this.dynamicDecorationMap[i] = false;
    return this.decorations = [
      ...allDeco,
      this.computeBlockGapDeco(),
      this.view.viewState.lineGapDeco
    ];
  }
  scrollIntoView(target) {
    let { range } = target;
    let rect = this.coordsAt(range.head, range.empty ? range.assoc : range.head > range.anchor ? -1 : 1), other;
    if (!rect)
      return;
    if (!range.empty && (other = this.coordsAt(range.anchor, range.anchor > range.head ? -1 : 1)))
      rect = {
        left: Math.min(rect.left, other.left),
        top: Math.min(rect.top, other.top),
        right: Math.max(rect.right, other.right),
        bottom: Math.max(rect.bottom, other.bottom)
      };
    let margins = getScrollMargins(this.view);
    let targetRect = {
      left: rect.left - margins.left,
      top: rect.top - margins.top,
      right: rect.right + margins.right,
      bottom: rect.bottom + margins.bottom
    };
    scrollRectIntoView(this.view.scrollDOM, targetRect, range.head < range.anchor ? -1 : 1, target.x, target.y, target.xMargin, target.yMargin, this.view.textDirection == Direction.LTR);
  }
}

class BlockGapWidget extends WidgetType {
  constructor(height) {
    super();
    this.height = height;
  }
  toDOM() {
    let elt = document.createElement("div");
    this.updateDOM(elt);
    return elt;
  }
  eq(other) {
    return other.height == this.height;
  }
  updateDOM(elt) {
    elt.style.height = this.height + "px";
    return true;
  }
  get estimatedHeight() {
    return this.height;
  }
}
var DecorationComparator$1 = class DecorationComparator {
  constructor() {
    this.changes = [];
  }
  compareRange(from, to) {
    addRange(from, to, this.changes);
  }
  comparePoint(from, to) {
    addRange(from, to, this.changes);
  }
};

class InputState {
  setSelectionOrigin(origin) {
    this.lastSelectionOrigin = origin;
    this.lastSelectionTime = Date.now();
  }
  constructor(view) {
    this.lastKeyCode = 0;
    this.lastKeyTime = 0;
    this.lastTouchTime = 0;
    this.lastFocusTime = 0;
    this.lastScrollTop = 0;
    this.lastScrollLeft = 0;
    this.chromeScrollHack = -1;
    this.pendingIOSKey = undefined;
    this.lastSelectionOrigin = null;
    this.lastSelectionTime = 0;
    this.lastEscPress = 0;
    this.lastContextMenu = 0;
    this.scrollHandlers = [];
    this.registeredEvents = [];
    this.customHandlers = [];
    this.composing = -1;
    this.compositionFirstChange = null;
    this.compositionEndedAt = 0;
    this.compositionPendingKey = false;
    this.compositionPendingChange = false;
    this.mouseSelection = null;
    let handleEvent = (handler, event) => {
      if (this.ignoreDuringComposition(event))
        return;
      if (event.type == "keydown" && this.keydown(view, event))
        return;
      if (this.mustFlushObserver(event))
        view.observer.forceFlush();
      if (this.runCustomHandlers(event.type, view, event))
        event.preventDefault();
      else
        handler(view, event);
    };
    for (let type in handlers) {
      let handler = handlers[type];
      view.contentDOM.addEventListener(type, (event) => {
        if (eventBelongsToEditor(view, event))
          handleEvent(handler, event);
      }, handlerOptions[type]);
      this.registeredEvents.push(type);
    }
    view.scrollDOM.addEventListener("mousedown", (event) => {
      if (event.target == view.scrollDOM && event.clientY > view.contentDOM.getBoundingClientRect().bottom) {
        handleEvent(handlers.mousedown, event);
        if (!event.defaultPrevented && event.button == 2) {
          let start = view.contentDOM.style.minHeight;
          view.contentDOM.style.minHeight = "100%";
          setTimeout(() => view.contentDOM.style.minHeight = start, 200);
        }
      }
    });
    view.scrollDOM.addEventListener("drop", (event) => {
      if (event.target == view.scrollDOM && event.clientY > view.contentDOM.getBoundingClientRect().bottom)
        handleEvent(handlers.drop, event);
    });
    if (browser.chrome && browser.chrome_version == 102) {
      view.scrollDOM.addEventListener("wheel", () => {
        if (this.chromeScrollHack < 0)
          view.contentDOM.style.pointerEvents = "none";
        else
          window.clearTimeout(this.chromeScrollHack);
        this.chromeScrollHack = setTimeout(() => {
          this.chromeScrollHack = -1;
          view.contentDOM.style.pointerEvents = "";
        }, 100);
      }, { passive: true });
    }
    this.notifiedFocused = view.hasFocus;
    if (browser.safari)
      view.contentDOM.addEventListener("input", () => null);
    if (browser.gecko)
      firefoxCopyCutHack(view.contentDOM.ownerDocument);
  }
  ensureHandlers(view, plugins) {
    var _a;
    let handlers;
    this.customHandlers = [];
    for (let plugin of plugins)
      if (handlers = (_a = plugin.update(view).spec) === null || _a === undefined ? undefined : _a.domEventHandlers) {
        this.customHandlers.push({ plugin: plugin.value, handlers });
        for (let type in handlers)
          if (this.registeredEvents.indexOf(type) < 0 && type != "scroll") {
            this.registeredEvents.push(type);
            view.contentDOM.addEventListener(type, (event) => {
              if (!eventBelongsToEditor(view, event))
                return;
              if (this.runCustomHandlers(type, view, event))
                event.preventDefault();
            });
          }
      }
  }
  runCustomHandlers(type, view, event) {
    for (let set of this.customHandlers) {
      let handler = set.handlers[type];
      if (handler) {
        try {
          if (handler.call(set.plugin, event, view) || event.defaultPrevented)
            return true;
        } catch (e) {
          logException(view.state, e);
        }
      }
    }
    return false;
  }
  runScrollHandlers(view, event) {
    this.lastScrollTop = view.scrollDOM.scrollTop;
    this.lastScrollLeft = view.scrollDOM.scrollLeft;
    for (let set of this.customHandlers) {
      let handler = set.handlers.scroll;
      if (handler) {
        try {
          handler.call(set.plugin, event, view);
        } catch (e) {
          logException(view.state, e);
        }
      }
    }
  }
  keydown(view, event) {
    this.lastKeyCode = event.keyCode;
    this.lastKeyTime = Date.now();
    if (event.keyCode == 9 && Date.now() < this.lastEscPress + 2000)
      return true;
    if (event.keyCode != 27 && modifierCodes.indexOf(event.keyCode) < 0)
      view.inputState.lastEscPress = 0;
    if (browser.android && browser.chrome && !event.synthetic && (event.keyCode == 13 || event.keyCode == 8)) {
      view.observer.delayAndroidKey(event.key, event.keyCode);
      return true;
    }
    let pending;
    if (browser.ios && !event.synthetic && !event.altKey && !event.metaKey && ((pending = PendingKeys.find((key) => key.keyCode == event.keyCode)) && !event.ctrlKey || EmacsyPendingKeys.indexOf(event.key) > -1 && event.ctrlKey && !event.shiftKey)) {
      this.pendingIOSKey = pending || event;
      setTimeout(() => this.flushIOSKey(view), 250);
      return true;
    }
    return false;
  }
  flushIOSKey(view) {
    let key = this.pendingIOSKey;
    if (!key)
      return false;
    this.pendingIOSKey = undefined;
    return dispatchKey(view.contentDOM, key.key, key.keyCode);
  }
  ignoreDuringComposition(event) {
    if (!/^key/.test(event.type))
      return false;
    if (this.composing > 0)
      return true;
    if (browser.safari && !browser.ios && this.compositionPendingKey && Date.now() - this.compositionEndedAt < 100) {
      this.compositionPendingKey = false;
      return true;
    }
    return false;
  }
  mustFlushObserver(event) {
    return event.type == "keydown" && event.keyCode != 229;
  }
  startMouseSelection(mouseSelection) {
    if (this.mouseSelection)
      this.mouseSelection.destroy();
    this.mouseSelection = mouseSelection;
  }
  update(update) {
    if (this.mouseSelection)
      this.mouseSelection.update(update);
    if (update.transactions.length)
      this.lastKeyCode = this.lastSelectionTime = 0;
  }
  destroy() {
    if (this.mouseSelection)
      this.mouseSelection.destroy();
  }
}
var PendingKeys = [
  { key: "Backspace", keyCode: 8, inputType: "deleteContentBackward" },
  { key: "Enter", keyCode: 13, inputType: "insertParagraph" },
  { key: "Enter", keyCode: 13, inputType: "insertLineBreak" },
  { key: "Delete", keyCode: 46, inputType: "deleteContentForward" }
];
var EmacsyPendingKeys = "dthko";
var modifierCodes = [16, 17, 18, 20, 91, 92, 224, 225];
var dragScrollMargin = 6;

class MouseSelection {
  constructor(view, startEvent, style, mustSelect) {
    this.view = view;
    this.startEvent = startEvent;
    this.style = style;
    this.mustSelect = mustSelect;
    this.scrollSpeed = { x: 0, y: 0 };
    this.scrolling = -1;
    this.lastEvent = startEvent;
    this.scrollParent = scrollableParent(view.contentDOM);
    this.atoms = view.state.facet(atomicRanges).map((f) => f(view));
    let doc2 = view.contentDOM.ownerDocument;
    doc2.addEventListener("mousemove", this.move = this.move.bind(this));
    doc2.addEventListener("mouseup", this.up = this.up.bind(this));
    this.extend = startEvent.shiftKey;
    this.multiple = view.state.facet(EditorState.allowMultipleSelections) && addsSelectionRange(view, startEvent);
    this.dragging = isInPrimarySelection(view, startEvent) && getClickType(startEvent) == 1 ? null : false;
  }
  start(event) {
    if (this.dragging === false) {
      event.preventDefault();
      this.select(event);
    }
  }
  move(event) {
    var _a;
    if (event.buttons == 0)
      return this.destroy();
    if (this.dragging || this.dragging == null && dist(this.startEvent, event) < 10)
      return;
    this.select(this.lastEvent = event);
    let sx = 0, sy = 0;
    let rect = ((_a = this.scrollParent) === null || _a === undefined ? undefined : _a.getBoundingClientRect()) || { left: 0, top: 0, right: this.view.win.innerWidth, bottom: this.view.win.innerHeight };
    let margins = getScrollMargins(this.view);
    if (event.clientX - margins.left <= rect.left + dragScrollMargin)
      sx = -dragScrollSpeed(rect.left - event.clientX);
    else if (event.clientX + margins.right >= rect.right - dragScrollMargin)
      sx = dragScrollSpeed(event.clientX - rect.right);
    if (event.clientY - margins.top <= rect.top + dragScrollMargin)
      sy = -dragScrollSpeed(rect.top - event.clientY);
    else if (event.clientY + margins.bottom >= rect.bottom - dragScrollMargin)
      sy = dragScrollSpeed(event.clientY - rect.bottom);
    this.setScrollSpeed(sx, sy);
  }
  up(event) {
    if (this.dragging == null)
      this.select(this.lastEvent);
    if (!this.dragging)
      event.preventDefault();
    this.destroy();
  }
  destroy() {
    this.setScrollSpeed(0, 0);
    let doc2 = this.view.contentDOM.ownerDocument;
    doc2.removeEventListener("mousemove", this.move);
    doc2.removeEventListener("mouseup", this.up);
    this.view.inputState.mouseSelection = null;
  }
  setScrollSpeed(sx, sy) {
    this.scrollSpeed = { x: sx, y: sy };
    if (sx || sy) {
      if (this.scrolling < 0)
        this.scrolling = setInterval(() => this.scroll(), 50);
    } else if (this.scrolling > -1) {
      clearInterval(this.scrolling);
      this.scrolling = -1;
    }
  }
  scroll() {
    if (this.scrollParent) {
      this.scrollParent.scrollLeft += this.scrollSpeed.x;
      this.scrollParent.scrollTop += this.scrollSpeed.y;
    } else {
      this.view.win.scrollBy(this.scrollSpeed.x, this.scrollSpeed.y);
    }
    if (this.dragging === false)
      this.select(this.lastEvent);
  }
  skipAtoms(sel) {
    let ranges = null;
    for (let i = 0;i < sel.ranges.length; i++) {
      let range = sel.ranges[i], updated = null;
      if (range.empty) {
        let pos = skipAtomicRanges(this.atoms, range.from, 0);
        if (pos != range.from)
          updated = EditorSelection.cursor(pos, -1);
      } else {
        let from = skipAtomicRanges(this.atoms, range.from, -1);
        let to = skipAtomicRanges(this.atoms, range.to, 1);
        if (from != range.from || to != range.to)
          updated = EditorSelection.range(range.from == range.anchor ? from : to, range.from == range.head ? from : to);
      }
      if (updated) {
        if (!ranges)
          ranges = sel.ranges.slice();
        ranges[i] = updated;
      }
    }
    return ranges ? EditorSelection.create(ranges, sel.mainIndex) : sel;
  }
  select(event) {
    let { view } = this, selection = this.skipAtoms(this.style.get(event, this.extend, this.multiple));
    if (this.mustSelect || !selection.eq(view.state.selection) || selection.main.assoc != view.state.selection.main.assoc && this.dragging === false)
      this.view.dispatch({
        selection,
        userEvent: "select.pointer"
      });
    this.mustSelect = false;
  }
  update(update) {
    if (update.docChanged && this.dragging)
      this.dragging = this.dragging.map(update.changes);
    if (this.style.update(update))
      setTimeout(() => this.select(this.lastEvent), 20);
  }
}
var handlers = Object.create(null);
var handlerOptions = Object.create(null);
var brokenClipboardAPI = browser.ie && browser.ie_version < 15 || browser.ios && browser.webkit_version < 604;
handlers.keydown = (view, event) => {
  view.inputState.setSelectionOrigin("select");
  if (event.keyCode == 27)
    view.inputState.lastEscPress = Date.now();
};
handlers.touchstart = (view, e) => {
  view.inputState.lastTouchTime = Date.now();
  view.inputState.setSelectionOrigin("select.pointer");
};
handlers.touchmove = (view) => {
  view.inputState.setSelectionOrigin("select.pointer");
};
handlerOptions.touchstart = handlerOptions.touchmove = { passive: true };
handlers.mousedown = (view, event) => {
  view.observer.flush();
  if (view.inputState.lastTouchTime > Date.now() - 2000)
    return;
  let style = null;
  for (let makeStyle of view.state.facet(mouseSelectionStyle)) {
    style = makeStyle(view, event);
    if (style)
      break;
  }
  if (!style && event.button == 0)
    style = basicMouseSelection(view, event);
  if (style) {
    let mustFocus = !view.hasFocus;
    view.inputState.startMouseSelection(new MouseSelection(view, event, style, mustFocus));
    if (mustFocus)
      view.observer.ignore(() => focusPreventScroll(view.contentDOM));
    if (view.inputState.mouseSelection)
      view.inputState.mouseSelection.start(event);
  }
};
var insideY = (y, rect) => y >= rect.top && y <= rect.bottom;
var inside = (x, y, rect) => insideY(y, rect) && x >= rect.left && x <= rect.right;
var BadMouseDetail = browser.ie && browser.ie_version <= 11;
var lastMouseDown = null;
var lastMouseDownCount = 0;
var lastMouseDownTime = 0;
handlers.dragstart = (view, event) => {
  let { selection: { main } } = view.state;
  let { mouseSelection } = view.inputState;
  if (mouseSelection)
    mouseSelection.dragging = main;
  if (event.dataTransfer) {
    event.dataTransfer.setData("Text", view.state.sliceDoc(main.from, main.to));
    event.dataTransfer.effectAllowed = "copyMove";
  }
};
handlers.drop = (view, event) => {
  if (!event.dataTransfer)
    return;
  if (view.state.readOnly)
    return event.preventDefault();
  let files = event.dataTransfer.files;
  if (files && files.length) {
    event.preventDefault();
    let text = Array(files.length), read = 0;
    let finishFile = () => {
      if (++read == files.length)
        dropText(view, event, text.filter((s) => s != null).join(view.state.lineBreak), false);
    };
    for (let i = 0;i < files.length; i++) {
      let reader = new FileReader;
      reader.onerror = finishFile;
      reader.onload = () => {
        if (!/[\x00-\x08\x0e-\x1f]{2}/.test(reader.result))
          text[i] = reader.result;
        finishFile();
      };
      reader.readAsText(files[i]);
    }
  } else {
    dropText(view, event, event.dataTransfer.getData("Text"), true);
  }
};
handlers.paste = (view, event) => {
  if (view.state.readOnly)
    return event.preventDefault();
  view.observer.flush();
  let data = brokenClipboardAPI ? null : event.clipboardData;
  if (data) {
    doPaste(view, data.getData("text/plain") || data.getData("text/uri-text"));
    event.preventDefault();
  } else {
    capturePaste(view);
  }
};
var lastLinewiseCopy = null;
handlers.copy = handlers.cut = (view, event) => {
  let { text, ranges, linewise } = copiedRange(view.state);
  if (!text && !linewise)
    return;
  lastLinewiseCopy = linewise ? text : null;
  let data = brokenClipboardAPI ? null : event.clipboardData;
  if (data) {
    event.preventDefault();
    data.clearData();
    data.setData("text/plain", text);
  } else {
    captureCopy(view, text);
  }
  if (event.type == "cut" && !view.state.readOnly)
    view.dispatch({
      changes: ranges,
      scrollIntoView: true,
      userEvent: "delete.cut"
    });
};
var isFocusChange = Annotation.define();
handlers.focus = (view) => {
  view.inputState.lastFocusTime = Date.now();
  if (!view.scrollDOM.scrollTop && (view.inputState.lastScrollTop || view.inputState.lastScrollLeft)) {
    view.scrollDOM.scrollTop = view.inputState.lastScrollTop;
    view.scrollDOM.scrollLeft = view.inputState.lastScrollLeft;
  }
  updateForFocusChange(view);
};
handlers.blur = (view) => {
  view.observer.clearSelectionRange();
  updateForFocusChange(view);
};
handlers.compositionstart = handlers.compositionupdate = (view) => {
  if (view.inputState.compositionFirstChange == null)
    view.inputState.compositionFirstChange = true;
  if (view.inputState.composing < 0) {
    view.inputState.composing = 0;
  }
};
handlers.compositionend = (view) => {
  view.inputState.composing = -1;
  view.inputState.compositionEndedAt = Date.now();
  view.inputState.compositionPendingKey = true;
  view.inputState.compositionPendingChange = view.observer.pendingRecords().length > 0;
  view.inputState.compositionFirstChange = null;
  if (browser.chrome && browser.android) {
    view.observer.flushSoon();
  } else if (view.inputState.compositionPendingChange) {
    Promise.resolve().then(() => view.observer.flush());
  } else {
    setTimeout(() => {
      if (view.inputState.composing < 0 && view.docView.hasComposition)
        view.update([]);
    }, 50);
  }
};
handlers.contextmenu = (view) => {
  view.inputState.lastContextMenu = Date.now();
};
handlers.beforeinput = (view, event) => {
  var _a;
  let pending;
  if (browser.chrome && browser.android && (pending = PendingKeys.find((key) => key.inputType == event.inputType))) {
    view.observer.delayAndroidKey(pending.key, pending.keyCode);
    if (pending.key == "Backspace" || pending.key == "Delete") {
      let startViewHeight = ((_a = window.visualViewport) === null || _a === undefined ? undefined : _a.height) || 0;
      setTimeout(() => {
        var _a2;
        if ((((_a2 = window.visualViewport) === null || _a2 === undefined ? undefined : _a2.height) || 0) > startViewHeight + 10 && view.hasFocus) {
          view.contentDOM.blur();
          view.focus();
        }
      }, 100);
    }
  }
};
var appliedFirefoxHack = new Set;
var wrappingWhiteSpace = ["pre-wrap", "normal", "pre-line", "break-spaces"];

class HeightOracle {
  constructor(lineWrapping) {
    this.lineWrapping = lineWrapping;
    this.doc = Text.empty;
    this.heightSamples = {};
    this.lineHeight = 14;
    this.charWidth = 7;
    this.textHeight = 14;
    this.lineLength = 30;
    this.heightChanged = false;
  }
  heightForGap(from, to) {
    let lines = this.doc.lineAt(to).number - this.doc.lineAt(from).number + 1;
    if (this.lineWrapping)
      lines += Math.max(0, Math.ceil((to - from - lines * this.lineLength * 0.5) / this.lineLength));
    return this.lineHeight * lines;
  }
  heightForLine(length) {
    if (!this.lineWrapping)
      return this.lineHeight;
    let lines = 1 + Math.max(0, Math.ceil((length - this.lineLength) / (this.lineLength - 5)));
    return lines * this.lineHeight;
  }
  setDoc(doc2) {
    this.doc = doc2;
    return this;
  }
  mustRefreshForWrapping(whiteSpace) {
    return wrappingWhiteSpace.indexOf(whiteSpace) > -1 != this.lineWrapping;
  }
  mustRefreshForHeights(lineHeights) {
    let newHeight = false;
    for (let i = 0;i < lineHeights.length; i++) {
      let h = lineHeights[i];
      if (h < 0) {
        i++;
      } else if (!this.heightSamples[Math.floor(h * 10)]) {
        newHeight = true;
        this.heightSamples[Math.floor(h * 10)] = true;
      }
    }
    return newHeight;
  }
  refresh(whiteSpace, lineHeight, charWidth, textHeight, lineLength, knownHeights) {
    let lineWrapping = wrappingWhiteSpace.indexOf(whiteSpace) > -1;
    let changed = Math.round(lineHeight) != Math.round(this.lineHeight) || this.lineWrapping != lineWrapping;
    this.lineWrapping = lineWrapping;
    this.lineHeight = lineHeight;
    this.charWidth = charWidth;
    this.textHeight = textHeight;
    this.lineLength = lineLength;
    if (changed) {
      this.heightSamples = {};
      for (let i = 0;i < knownHeights.length; i++) {
        let h = knownHeights[i];
        if (h < 0)
          i++;
        else
          this.heightSamples[Math.floor(h * 10)] = true;
      }
    }
    return changed;
  }
}

class MeasuredHeights {
  constructor(from, heights) {
    this.from = from;
    this.heights = heights;
    this.index = 0;
  }
  get more() {
    return this.index < this.heights.length;
  }
}

class BlockInfo {
  constructor(from, length, top2, height, _content) {
    this.from = from;
    this.length = length;
    this.top = top2;
    this.height = height;
    this._content = _content;
  }
  get type() {
    return typeof this._content == "number" ? BlockType.Text : Array.isArray(this._content) ? this._content : this._content.type;
  }
  get to() {
    return this.from + this.length;
  }
  get bottom() {
    return this.top + this.height;
  }
  get widget() {
    return this._content instanceof PointDecoration ? this._content.widget : null;
  }
  get widgetLineBreaks() {
    return typeof this._content == "number" ? this._content : 0;
  }
  join(other) {
    let content = (Array.isArray(this._content) ? this._content : [this]).concat(Array.isArray(other._content) ? other._content : [other]);
    return new BlockInfo(this.from, this.length + other.length, this.top, this.height + other.height, content);
  }
}
var QueryType = function(QueryType2) {
  QueryType2[QueryType2["ByPos"] = 0] = "ByPos";
  QueryType2[QueryType2["ByHeight"] = 1] = "ByHeight";
  QueryType2[QueryType2["ByPosNoHeight"] = 2] = "ByPosNoHeight";
  return QueryType2;
}(QueryType || (QueryType = {}));
var Epsilon = 0.001;

class HeightMap {
  constructor(length, height, flags = 2) {
    this.length = length;
    this.height = height;
    this.flags = flags;
  }
  get outdated() {
    return (this.flags & 2) > 0;
  }
  set outdated(value) {
    this.flags = (value ? 2 : 0) | this.flags & ~2;
  }
  setHeight(oracle, height) {
    if (this.height != height) {
      if (Math.abs(this.height - height) > Epsilon)
        oracle.heightChanged = true;
      this.height = height;
    }
  }
  replace(_from, _to, nodes) {
    return HeightMap.of(nodes);
  }
  decomposeLeft(_to, result) {
    result.push(this);
  }
  decomposeRight(_from, result) {
    result.push(this);
  }
  applyChanges(decorations2, oldDoc, oracle, changes) {
    let me = this, doc2 = oracle.doc;
    for (let i = changes.length - 1;i >= 0; i--) {
      let { fromA, toA, fromB, toB } = changes[i];
      let start = me.lineAt(fromA, QueryType.ByPosNoHeight, oracle.setDoc(oldDoc), 0, 0);
      let end = start.to >= toA ? start : me.lineAt(toA, QueryType.ByPosNoHeight, oracle, 0, 0);
      toB += end.to - toA;
      toA = end.to;
      while (i > 0 && start.from <= changes[i - 1].toA) {
        fromA = changes[i - 1].fromA;
        fromB = changes[i - 1].fromB;
        i--;
        if (fromA < start.from)
          start = me.lineAt(fromA, QueryType.ByPosNoHeight, oracle, 0, 0);
      }
      fromB += start.from - fromA;
      fromA = start.from;
      let nodes = NodeBuilder.build(oracle.setDoc(doc2), decorations2, fromB, toB);
      me = me.replace(fromA, toA, nodes);
    }
    return me.updateHeight(oracle, 0);
  }
  static empty() {
    return new HeightMapText(0, 0);
  }
  static of(nodes) {
    if (nodes.length == 1)
      return nodes[0];
    let i = 0, j = nodes.length, before = 0, after = 0;
    for (;; ) {
      if (i == j) {
        if (before > after * 2) {
          let split = nodes[i - 1];
          if (split.break)
            nodes.splice(--i, 1, split.left, null, split.right);
          else
            nodes.splice(--i, 1, split.left, split.right);
          j += 1 + split.break;
          before -= split.size;
        } else if (after > before * 2) {
          let split = nodes[j];
          if (split.break)
            nodes.splice(j, 1, split.left, null, split.right);
          else
            nodes.splice(j, 1, split.left, split.right);
          j += 2 + split.break;
          after -= split.size;
        } else {
          break;
        }
      } else if (before < after) {
        let next = nodes[i++];
        if (next)
          before += next.size;
      } else {
        let next = nodes[--j];
        if (next)
          after += next.size;
      }
    }
    let brk = 0;
    if (nodes[i - 1] == null) {
      brk = 1;
      i--;
    } else if (nodes[i] == null) {
      brk = 1;
      j++;
    }
    return new HeightMapBranch(HeightMap.of(nodes.slice(0, i)), brk, HeightMap.of(nodes.slice(j)));
  }
}
HeightMap.prototype.size = 1;

class HeightMapBlock extends HeightMap {
  constructor(length, height, deco) {
    super(length, height);
    this.deco = deco;
  }
  blockAt(_height, _oracle, top2, offset) {
    return new BlockInfo(offset, this.length, top2, this.height, this.deco || 0);
  }
  lineAt(_value, _type, oracle, top2, offset) {
    return this.blockAt(0, oracle, top2, offset);
  }
  forEachLine(from, to, oracle, top2, offset, f) {
    if (from <= offset + this.length && to >= offset)
      f(this.blockAt(0, oracle, top2, offset));
  }
  updateHeight(oracle, offset = 0, _force = false, measured) {
    if (measured && measured.from <= offset && measured.more)
      this.setHeight(oracle, measured.heights[measured.index++]);
    this.outdated = false;
    return this;
  }
  toString() {
    return `block(${this.length})`;
  }
}

class HeightMapText extends HeightMapBlock {
  constructor(length, height) {
    super(length, height, null);
    this.collapsed = 0;
    this.widgetHeight = 0;
    this.breaks = 0;
  }
  blockAt(_height, _oracle, top2, offset) {
    return new BlockInfo(offset, this.length, top2, this.height, this.breaks);
  }
  replace(_from, _to, nodes) {
    let node = nodes[0];
    if (nodes.length == 1 && (node instanceof HeightMapText || node instanceof HeightMapGap && node.flags & 4) && Math.abs(this.length - node.length) < 10) {
      if (node instanceof HeightMapGap)
        node = new HeightMapText(node.length, this.height);
      else
        node.height = this.height;
      if (!this.outdated)
        node.outdated = false;
      return node;
    } else {
      return HeightMap.of(nodes);
    }
  }
  updateHeight(oracle, offset = 0, force = false, measured) {
    if (measured && measured.from <= offset && measured.more)
      this.setHeight(oracle, measured.heights[measured.index++]);
    else if (force || this.outdated)
      this.setHeight(oracle, Math.max(this.widgetHeight, oracle.heightForLine(this.length - this.collapsed)) + this.breaks * oracle.lineHeight);
    this.outdated = false;
    return this;
  }
  toString() {
    return `line(${this.length}${this.collapsed ? -this.collapsed : ""}${this.widgetHeight ? ":" + this.widgetHeight : ""})`;
  }
}

class HeightMapGap extends HeightMap {
  constructor(length) {
    super(length, 0);
  }
  heightMetrics(oracle, offset) {
    let firstLine = oracle.doc.lineAt(offset).number, lastLine = oracle.doc.lineAt(offset + this.length).number;
    let lines = lastLine - firstLine + 1;
    let perLine, perChar = 0;
    if (oracle.lineWrapping) {
      let totalPerLine = Math.min(this.height, oracle.lineHeight * lines);
      perLine = totalPerLine / lines;
      if (this.length > lines + 1)
        perChar = (this.height - totalPerLine) / (this.length - lines - 1);
    } else {
      perLine = this.height / lines;
    }
    return { firstLine, lastLine, perLine, perChar };
  }
  blockAt(height, oracle, top2, offset) {
    let { firstLine, lastLine, perLine, perChar } = this.heightMetrics(oracle, offset);
    if (oracle.lineWrapping) {
      let guess = offset + Math.round(Math.max(0, Math.min(1, (height - top2) / this.height)) * this.length);
      let line = oracle.doc.lineAt(guess), lineHeight = perLine + line.length * perChar;
      let lineTop = Math.max(top2, height - lineHeight / 2);
      return new BlockInfo(line.from, line.length, lineTop, lineHeight, 0);
    } else {
      let line = Math.max(0, Math.min(lastLine - firstLine, Math.floor((height - top2) / perLine)));
      let { from, length } = oracle.doc.line(firstLine + line);
      return new BlockInfo(from, length, top2 + perLine * line, perLine, 0);
    }
  }
  lineAt(value, type, oracle, top2, offset) {
    if (type == QueryType.ByHeight)
      return this.blockAt(value, oracle, top2, offset);
    if (type == QueryType.ByPosNoHeight) {
      let { from, to } = oracle.doc.lineAt(value);
      return new BlockInfo(from, to - from, 0, 0, 0);
    }
    let { firstLine, perLine, perChar } = this.heightMetrics(oracle, offset);
    let line = oracle.doc.lineAt(value), lineHeight = perLine + line.length * perChar;
    let linesAbove = line.number - firstLine;
    let lineTop = top2 + perLine * linesAbove + perChar * (line.from - offset - linesAbove);
    return new BlockInfo(line.from, line.length, Math.max(top2, Math.min(lineTop, top2 + this.height - lineHeight)), lineHeight, 0);
  }
  forEachLine(from, to, oracle, top2, offset, f) {
    from = Math.max(from, offset);
    to = Math.min(to, offset + this.length);
    let { firstLine, perLine, perChar } = this.heightMetrics(oracle, offset);
    for (let pos = from, lineTop = top2;pos <= to; ) {
      let line = oracle.doc.lineAt(pos);
      if (pos == from) {
        let linesAbove = line.number - firstLine;
        lineTop += perLine * linesAbove + perChar * (from - offset - linesAbove);
      }
      let lineHeight = perLine + perChar * line.length;
      f(new BlockInfo(line.from, line.length, lineTop, lineHeight, 0));
      lineTop += lineHeight;
      pos = line.to + 1;
    }
  }
  replace(from, to, nodes) {
    let after = this.length - to;
    if (after > 0) {
      let last = nodes[nodes.length - 1];
      if (last instanceof HeightMapGap)
        nodes[nodes.length - 1] = new HeightMapGap(last.length + after);
      else
        nodes.push(null, new HeightMapGap(after - 1));
    }
    if (from > 0) {
      let first = nodes[0];
      if (first instanceof HeightMapGap)
        nodes[0] = new HeightMapGap(from + first.length);
      else
        nodes.unshift(new HeightMapGap(from - 1), null);
    }
    return HeightMap.of(nodes);
  }
  decomposeLeft(to, result) {
    result.push(new HeightMapGap(to - 1), null);
  }
  decomposeRight(from, result) {
    result.push(null, new HeightMapGap(this.length - from - 1));
  }
  updateHeight(oracle, offset = 0, force = false, measured) {
    let end = offset + this.length;
    if (measured && measured.from <= offset + this.length && measured.more) {
      let nodes = [], pos = Math.max(offset, measured.from), singleHeight = -1;
      if (measured.from > offset)
        nodes.push(new HeightMapGap(measured.from - offset - 1).updateHeight(oracle, offset));
      while (pos <= end && measured.more) {
        let len = oracle.doc.lineAt(pos).length;
        if (nodes.length)
          nodes.push(null);
        let height = measured.heights[measured.index++];
        if (singleHeight == -1)
          singleHeight = height;
        else if (Math.abs(height - singleHeight) >= Epsilon)
          singleHeight = -2;
        let line = new HeightMapText(len, height);
        line.outdated = false;
        nodes.push(line);
        pos += len + 1;
      }
      if (pos <= end)
        nodes.push(null, new HeightMapGap(end - pos).updateHeight(oracle, pos));
      let result = HeightMap.of(nodes);
      if (singleHeight < 0 || Math.abs(result.height - this.height) >= Epsilon || Math.abs(singleHeight - this.heightMetrics(oracle, offset).perLine) >= Epsilon)
        oracle.heightChanged = true;
      return result;
    } else if (force || this.outdated) {
      this.setHeight(oracle, oracle.heightForGap(offset, offset + this.length));
      this.outdated = false;
    }
    return this;
  }
  toString() {
    return `gap(${this.length})`;
  }
}

class HeightMapBranch extends HeightMap {
  constructor(left, brk, right) {
    super(left.length + brk + right.length, left.height + right.height, brk | (left.outdated || right.outdated ? 2 : 0));
    this.left = left;
    this.right = right;
    this.size = left.size + right.size;
  }
  get break() {
    return this.flags & 1;
  }
  blockAt(height, oracle, top2, offset) {
    let mid = top2 + this.left.height;
    return height < mid ? this.left.blockAt(height, oracle, top2, offset) : this.right.blockAt(height, oracle, mid, offset + this.left.length + this.break);
  }
  lineAt(value, type, oracle, top2, offset) {
    let rightTop = top2 + this.left.height, rightOffset = offset + this.left.length + this.break;
    let left = type == QueryType.ByHeight ? value < rightTop : value < rightOffset;
    let base2 = left ? this.left.lineAt(value, type, oracle, top2, offset) : this.right.lineAt(value, type, oracle, rightTop, rightOffset);
    if (this.break || (left ? base2.to < rightOffset : base2.from > rightOffset))
      return base2;
    let subQuery = type == QueryType.ByPosNoHeight ? QueryType.ByPosNoHeight : QueryType.ByPos;
    if (left)
      return base2.join(this.right.lineAt(rightOffset, subQuery, oracle, rightTop, rightOffset));
    else
      return this.left.lineAt(rightOffset, subQuery, oracle, top2, offset).join(base2);
  }
  forEachLine(from, to, oracle, top2, offset, f) {
    let rightTop = top2 + this.left.height, rightOffset = offset + this.left.length + this.break;
    if (this.break) {
      if (from < rightOffset)
        this.left.forEachLine(from, to, oracle, top2, offset, f);
      if (to >= rightOffset)
        this.right.forEachLine(from, to, oracle, rightTop, rightOffset, f);
    } else {
      let mid = this.lineAt(rightOffset, QueryType.ByPos, oracle, top2, offset);
      if (from < mid.from)
        this.left.forEachLine(from, mid.from - 1, oracle, top2, offset, f);
      if (mid.to >= from && mid.from <= to)
        f(mid);
      if (to > mid.to)
        this.right.forEachLine(mid.to + 1, to, oracle, rightTop, rightOffset, f);
    }
  }
  replace(from, to, nodes) {
    let rightStart = this.left.length + this.break;
    if (to < rightStart)
      return this.balanced(this.left.replace(from, to, nodes), this.right);
    if (from > this.left.length)
      return this.balanced(this.left, this.right.replace(from - rightStart, to - rightStart, nodes));
    let result = [];
    if (from > 0)
      this.decomposeLeft(from, result);
    let left = result.length;
    for (let node of nodes)
      result.push(node);
    if (from > 0)
      mergeGaps(result, left - 1);
    if (to < this.length) {
      let right = result.length;
      this.decomposeRight(to, result);
      mergeGaps(result, right);
    }
    return HeightMap.of(result);
  }
  decomposeLeft(to, result) {
    let left = this.left.length;
    if (to <= left)
      return this.left.decomposeLeft(to, result);
    result.push(this.left);
    if (this.break) {
      left++;
      if (to >= left)
        result.push(null);
    }
    if (to > left)
      this.right.decomposeLeft(to - left, result);
  }
  decomposeRight(from, result) {
    let left = this.left.length, right = left + this.break;
    if (from >= right)
      return this.right.decomposeRight(from - right, result);
    if (from < left)
      this.left.decomposeRight(from, result);
    if (this.break && from < right)
      result.push(null);
    result.push(this.right);
  }
  balanced(left, right) {
    if (left.size > 2 * right.size || right.size > 2 * left.size)
      return HeightMap.of(this.break ? [left, null, right] : [left, right]);
    this.left = left;
    this.right = right;
    this.height = left.height + right.height;
    this.outdated = left.outdated || right.outdated;
    this.size = left.size + right.size;
    this.length = left.length + this.break + right.length;
    return this;
  }
  updateHeight(oracle, offset = 0, force = false, measured) {
    let { left, right } = this, rightStart = offset + left.length + this.break, rebalance = null;
    if (measured && measured.from <= offset + left.length && measured.more)
      rebalance = left = left.updateHeight(oracle, offset, force, measured);
    else
      left.updateHeight(oracle, offset, force);
    if (measured && measured.from <= rightStart + right.length && measured.more)
      rebalance = right = right.updateHeight(oracle, rightStart, force, measured);
    else
      right.updateHeight(oracle, rightStart, force);
    if (rebalance)
      return this.balanced(left, right);
    this.height = this.left.height + this.right.height;
    this.outdated = false;
    return this;
  }
  toString() {
    return this.left + (this.break ? " " : "-") + this.right;
  }
}
var relevantWidgetHeight = 5;

class NodeBuilder {
  constructor(pos, oracle) {
    this.pos = pos;
    this.oracle = oracle;
    this.nodes = [];
    this.lineStart = -1;
    this.lineEnd = -1;
    this.covering = null;
    this.writtenTo = pos;
  }
  get isCovered() {
    return this.covering && this.nodes[this.nodes.length - 1] == this.covering;
  }
  span(_from, to) {
    if (this.lineStart > -1) {
      let end = Math.min(to, this.lineEnd), last = this.nodes[this.nodes.length - 1];
      if (last instanceof HeightMapText)
        last.length += end - this.pos;
      else if (end > this.pos || !this.isCovered)
        this.nodes.push(new HeightMapText(end - this.pos, -1));
      this.writtenTo = end;
      if (to > end) {
        this.nodes.push(null);
        this.writtenTo++;
        this.lineStart = -1;
      }
    }
    this.pos = to;
  }
  point(from, to, deco) {
    if (from < to || deco.heightRelevant) {
      let height = deco.widget ? deco.widget.estimatedHeight : 0;
      let breaks = deco.widget ? deco.widget.lineBreaks : 0;
      if (height < 0)
        height = this.oracle.lineHeight;
      let len = to - from;
      if (deco.block) {
        this.addBlock(new HeightMapBlock(len, height, deco));
      } else if (len || breaks || height >= relevantWidgetHeight) {
        this.addLineDeco(height, breaks, len);
      }
    } else if (to > from) {
      this.span(from, to);
    }
    if (this.lineEnd > -1 && this.lineEnd < this.pos)
      this.lineEnd = this.oracle.doc.lineAt(this.pos).to;
  }
  enterLine() {
    if (this.lineStart > -1)
      return;
    let { from, to } = this.oracle.doc.lineAt(this.pos);
    this.lineStart = from;
    this.lineEnd = to;
    if (this.writtenTo < from) {
      if (this.writtenTo < from - 1 || this.nodes[this.nodes.length - 1] == null)
        this.nodes.push(this.blankContent(this.writtenTo, from - 1));
      this.nodes.push(null);
    }
    if (this.pos > from)
      this.nodes.push(new HeightMapText(this.pos - from, -1));
    this.writtenTo = this.pos;
  }
  blankContent(from, to) {
    let gap = new HeightMapGap(to - from);
    if (this.oracle.doc.lineAt(from).to == to)
      gap.flags |= 4;
    return gap;
  }
  ensureLine() {
    this.enterLine();
    let last = this.nodes.length ? this.nodes[this.nodes.length - 1] : null;
    if (last instanceof HeightMapText)
      return last;
    let line = new HeightMapText(0, -1);
    this.nodes.push(line);
    return line;
  }
  addBlock(block) {
    var _a;
    this.enterLine();
    let type = (_a = block.deco) === null || _a === undefined ? undefined : _a.type;
    if (type == BlockType.WidgetAfter && !this.isCovered)
      this.ensureLine();
    this.nodes.push(block);
    this.writtenTo = this.pos = this.pos + block.length;
    if (type != BlockType.WidgetBefore)
      this.covering = block;
  }
  addLineDeco(height, breaks, length) {
    let line = this.ensureLine();
    line.length += length;
    line.collapsed += length;
    line.widgetHeight = Math.max(line.widgetHeight, height);
    line.breaks += breaks;
    this.writtenTo = this.pos = this.pos + length;
  }
  finish(from) {
    let last = this.nodes.length == 0 ? null : this.nodes[this.nodes.length - 1];
    if (this.lineStart > -1 && !(last instanceof HeightMapText) && !this.isCovered)
      this.nodes.push(new HeightMapText(0, -1));
    else if (this.writtenTo < this.pos || last == null)
      this.nodes.push(this.blankContent(this.writtenTo, this.pos));
    let pos = from;
    for (let node of this.nodes) {
      if (node instanceof HeightMapText)
        node.updateHeight(this.oracle, pos);
      pos += node ? node.length : 1;
    }
    return this.nodes;
  }
  static build(oracle, decorations2, from, to) {
    let builder = new NodeBuilder(from, oracle);
    RangeSet.spans(decorations2, from, to, builder, 0);
    return builder.finish(from);
  }
}

class DecorationComparator2 {
  constructor() {
    this.changes = [];
  }
  compareRange() {
  }
  comparePoint(from, to, a, b) {
    if (from < to || a && a.heightRelevant || b && b.heightRelevant)
      addRange(from, to, this.changes, 5);
  }
}

class LineGap {
  constructor(from, to, size) {
    this.from = from;
    this.to = to;
    this.size = size;
  }
  static same(a, b) {
    if (a.length != b.length)
      return false;
    for (let i = 0;i < a.length; i++) {
      let gA = a[i], gB = b[i];
      if (gA.from != gB.from || gA.to != gB.to || gA.size != gB.size)
        return false;
    }
    return true;
  }
  draw(viewState, wrapping) {
    return Decoration.replace({
      widget: new LineGapWidget(this.size * (wrapping ? viewState.scaleY : viewState.scaleX), wrapping)
    }).range(this.from, this.to);
  }
}

class LineGapWidget extends WidgetType {
  constructor(size, vertical) {
    super();
    this.size = size;
    this.vertical = vertical;
  }
  eq(other) {
    return other.size == this.size && other.vertical == this.vertical;
  }
  toDOM() {
    let elt = document.createElement("div");
    if (this.vertical) {
      elt.style.height = this.size + "px";
    } else {
      elt.style.width = this.size + "px";
      elt.style.height = "2px";
      elt.style.display = "inline-block";
    }
    return elt;
  }
  get estimatedHeight() {
    return this.vertical ? this.size : -1;
  }
}

class ViewState {
  constructor(state2) {
    this.state = state2;
    this.pixelViewport = { left: 0, right: window.innerWidth, top: 0, bottom: 0 };
    this.inView = true;
    this.paddingTop = 0;
    this.paddingBottom = 0;
    this.contentDOMWidth = 0;
    this.contentDOMHeight = 0;
    this.editorHeight = 0;
    this.editorWidth = 0;
    this.scrollTop = 0;
    this.scrolledToBottom = true;
    this.scaleX = 1;
    this.scaleY = 1;
    this.scrollAnchorPos = 0;
    this.scrollAnchorHeight = -1;
    this.scaler = IdScaler;
    this.scrollTarget = null;
    this.printing = false;
    this.mustMeasureContent = true;
    this.defaultTextDirection = Direction.LTR;
    this.visibleRanges = [];
    this.mustEnforceCursorAssoc = false;
    let guessWrapping = state2.facet(contentAttributes).some((v) => typeof v != "function" && v.class == "cm-lineWrapping");
    this.heightOracle = new HeightOracle(guessWrapping);
    this.stateDeco = state2.facet(decorations).filter((d) => typeof d != "function");
    this.heightMap = HeightMap.empty().applyChanges(this.stateDeco, Text.empty, this.heightOracle.setDoc(state2.doc), [new ChangedRange(0, 0, 0, state2.doc.length)]);
    this.viewport = this.getViewport(0, null);
    this.updateViewportLines();
    this.updateForViewport();
    this.lineGaps = this.ensureLineGaps([]);
    this.lineGapDeco = Decoration.set(this.lineGaps.map((gap) => gap.draw(this, false)));
    this.computeVisibleRanges();
  }
  updateForViewport() {
    let viewports = [this.viewport], { main } = this.state.selection;
    for (let i = 0;i <= 1; i++) {
      let pos = i ? main.head : main.anchor;
      if (!viewports.some(({ from, to }) => pos >= from && pos <= to)) {
        let { from, to } = this.lineBlockAt(pos);
        viewports.push(new Viewport(from, to));
      }
    }
    this.viewports = viewports.sort((a, b) => a.from - b.from);
    this.scaler = this.heightMap.height <= 7000000 ? IdScaler : new BigScaler(this.heightOracle, this.heightMap, this.viewports);
  }
  updateViewportLines() {
    this.viewportLines = [];
    this.heightMap.forEachLine(this.viewport.from, this.viewport.to, this.heightOracle.setDoc(this.state.doc), 0, 0, (block) => {
      this.viewportLines.push(this.scaler.scale == 1 ? block : scaleBlock(block, this.scaler));
    });
  }
  update(update, scrollTarget = null) {
    this.state = update.state;
    let prevDeco = this.stateDeco;
    this.stateDeco = this.state.facet(decorations).filter((d) => typeof d != "function");
    let contentChanges = update.changedRanges;
    let heightChanges = ChangedRange.extendWithRanges(contentChanges, heightRelevantDecoChanges(prevDeco, this.stateDeco, update ? update.changes : ChangeSet.empty(this.state.doc.length)));
    let prevHeight = this.heightMap.height;
    let scrollAnchor = this.scrolledToBottom ? null : this.scrollAnchorAt(this.scrollTop);
    this.heightMap = this.heightMap.applyChanges(this.stateDeco, update.startState.doc, this.heightOracle.setDoc(this.state.doc), heightChanges);
    if (this.heightMap.height != prevHeight)
      update.flags |= 2;
    if (scrollAnchor) {
      this.scrollAnchorPos = update.changes.mapPos(scrollAnchor.from, -1);
      this.scrollAnchorHeight = scrollAnchor.top;
    } else {
      this.scrollAnchorPos = -1;
      this.scrollAnchorHeight = this.heightMap.height;
    }
    let viewport = heightChanges.length ? this.mapViewport(this.viewport, update.changes) : this.viewport;
    if (scrollTarget && (scrollTarget.range.head < viewport.from || scrollTarget.range.head > viewport.to) || !this.viewportIsAppropriate(viewport))
      viewport = this.getViewport(0, scrollTarget);
    let updateLines = !update.changes.empty || update.flags & 2 || viewport.from != this.viewport.from || viewport.to != this.viewport.to;
    this.viewport = viewport;
    this.updateForViewport();
    if (updateLines)
      this.updateViewportLines();
    if (this.lineGaps.length || this.viewport.to - this.viewport.from > 2000 << 1)
      this.updateLineGaps(this.ensureLineGaps(this.mapLineGaps(this.lineGaps, update.changes)));
    update.flags |= this.computeVisibleRanges();
    if (scrollTarget)
      this.scrollTarget = scrollTarget;
    if (!this.mustEnforceCursorAssoc && update.selectionSet && update.view.lineWrapping && update.state.selection.main.empty && update.state.selection.main.assoc && !update.state.facet(nativeSelectionHidden))
      this.mustEnforceCursorAssoc = true;
  }
  measure(view) {
    let dom = view.contentDOM, style = window.getComputedStyle(dom);
    let oracle = this.heightOracle;
    let whiteSpace = style.whiteSpace;
    this.defaultTextDirection = style.direction == "rtl" ? Direction.RTL : Direction.LTR;
    let refresh = this.heightOracle.mustRefreshForWrapping(whiteSpace);
    let domRect = dom.getBoundingClientRect();
    let measureContent = refresh || this.mustMeasureContent || this.contentDOMHeight != domRect.height;
    this.contentDOMHeight = domRect.height;
    this.mustMeasureContent = false;
    let result = 0, bias = 0;
    if (domRect.width && domRect.height) {
      let scaleX = domRect.width / dom.offsetWidth;
      let scaleY = domRect.height / dom.offsetHeight;
      if (scaleX > 0.995 && scaleX < 1.005)
        scaleX = 1;
      if (scaleY > 0.995 && scaleY < 1.005)
        scaleY = 1;
      if (this.scaleX != scaleX || this.scaleY != scaleY) {
        this.scaleX = scaleX;
        this.scaleY = scaleY;
        result |= 8;
        refresh = measureContent = true;
      }
    }
    let paddingTop = (parseInt(style.paddingTop) || 0) * this.scaleY;
    let paddingBottom = (parseInt(style.paddingBottom) || 0) * this.scaleY;
    if (this.paddingTop != paddingTop || this.paddingBottom != paddingBottom) {
      this.paddingTop = paddingTop;
      this.paddingBottom = paddingBottom;
      result |= 8 | 2;
    }
    if (this.editorWidth != view.scrollDOM.clientWidth) {
      if (oracle.lineWrapping)
        measureContent = true;
      this.editorWidth = view.scrollDOM.clientWidth;
      result |= 8;
    }
    let scrollTop = view.scrollDOM.scrollTop * this.scaleY;
    if (this.scrollTop != scrollTop) {
      this.scrollAnchorHeight = -1;
      this.scrollTop = scrollTop;
    }
    this.scrolledToBottom = isScrolledToBottom(view.scrollDOM);
    let pixelViewport = (this.printing ? fullPixelRange : visiblePixelRange)(dom, this.paddingTop);
    let dTop = pixelViewport.top - this.pixelViewport.top, dBottom = pixelViewport.bottom - this.pixelViewport.bottom;
    this.pixelViewport = pixelViewport;
    let inView = this.pixelViewport.bottom > this.pixelViewport.top && this.pixelViewport.right > this.pixelViewport.left;
    if (inView != this.inView) {
      this.inView = inView;
      if (inView)
        measureContent = true;
    }
    if (!this.inView && !this.scrollTarget)
      return 0;
    let contentWidth = domRect.width;
    if (this.contentDOMWidth != contentWidth || this.editorHeight != view.scrollDOM.clientHeight) {
      this.contentDOMWidth = domRect.width;
      this.editorHeight = view.scrollDOM.clientHeight;
      result |= 8;
    }
    if (measureContent) {
      let lineHeights = view.docView.measureVisibleLineHeights(this.viewport);
      if (oracle.mustRefreshForHeights(lineHeights))
        refresh = true;
      if (refresh || oracle.lineWrapping && Math.abs(contentWidth - this.contentDOMWidth) > oracle.charWidth) {
        let { lineHeight, charWidth, textHeight } = view.docView.measureTextSize();
        refresh = lineHeight > 0 && oracle.refresh(whiteSpace, lineHeight, charWidth, textHeight, contentWidth / charWidth, lineHeights);
        if (refresh) {
          view.docView.minWidth = 0;
          result |= 8;
        }
      }
      if (dTop > 0 && dBottom > 0)
        bias = Math.max(dTop, dBottom);
      else if (dTop < 0 && dBottom < 0)
        bias = Math.min(dTop, dBottom);
      oracle.heightChanged = false;
      for (let vp of this.viewports) {
        let heights = vp.from == this.viewport.from ? lineHeights : view.docView.measureVisibleLineHeights(vp);
        this.heightMap = (refresh ? HeightMap.empty().applyChanges(this.stateDeco, Text.empty, this.heightOracle, [new ChangedRange(0, 0, 0, view.state.doc.length)]) : this.heightMap).updateHeight(oracle, 0, refresh, new MeasuredHeights(vp.from, heights));
      }
      if (oracle.heightChanged)
        result |= 2;
    }
    let viewportChange = !this.viewportIsAppropriate(this.viewport, bias) || this.scrollTarget && (this.scrollTarget.range.head < this.viewport.from || this.scrollTarget.range.head > this.viewport.to);
    if (viewportChange)
      this.viewport = this.getViewport(bias, this.scrollTarget);
    this.updateForViewport();
    if (result & 2 || viewportChange)
      this.updateViewportLines();
    if (this.lineGaps.length || this.viewport.to - this.viewport.from > 2000 << 1)
      this.updateLineGaps(this.ensureLineGaps(refresh ? [] : this.lineGaps, view));
    result |= this.computeVisibleRanges();
    if (this.mustEnforceCursorAssoc) {
      this.mustEnforceCursorAssoc = false;
      view.docView.enforceCursorAssoc();
    }
    return result;
  }
  get visibleTop() {
    return this.scaler.fromDOM(this.pixelViewport.top);
  }
  get visibleBottom() {
    return this.scaler.fromDOM(this.pixelViewport.bottom);
  }
  getViewport(bias, scrollTarget) {
    let marginTop = 0.5 - Math.max(-0.5, Math.min(0.5, bias / 1000 / 2));
    let map = this.heightMap, oracle = this.heightOracle;
    let { visibleTop, visibleBottom } = this;
    let viewport = new Viewport(map.lineAt(visibleTop - marginTop * 1000, QueryType.ByHeight, oracle, 0, 0).from, map.lineAt(visibleBottom + (1 - marginTop) * 1000, QueryType.ByHeight, oracle, 0, 0).to);
    if (scrollTarget) {
      let { head } = scrollTarget.range;
      if (head < viewport.from || head > viewport.to) {
        let viewHeight = Math.min(this.editorHeight, this.pixelViewport.bottom - this.pixelViewport.top);
        let block = map.lineAt(head, QueryType.ByPos, oracle, 0, 0), topPos;
        if (scrollTarget.y == "center")
          topPos = (block.top + block.bottom) / 2 - viewHeight / 2;
        else if (scrollTarget.y == "start" || scrollTarget.y == "nearest" && head < viewport.from)
          topPos = block.top;
        else
          topPos = block.bottom - viewHeight;
        viewport = new Viewport(map.lineAt(topPos - 1000 / 2, QueryType.ByHeight, oracle, 0, 0).from, map.lineAt(topPos + viewHeight + 1000 / 2, QueryType.ByHeight, oracle, 0, 0).to);
      }
    }
    return viewport;
  }
  mapViewport(viewport, changes) {
    let from = changes.mapPos(viewport.from, -1), to = changes.mapPos(viewport.to, 1);
    return new Viewport(this.heightMap.lineAt(from, QueryType.ByPos, this.heightOracle, 0, 0).from, this.heightMap.lineAt(to, QueryType.ByPos, this.heightOracle, 0, 0).to);
  }
  viewportIsAppropriate({ from, to }, bias = 0) {
    if (!this.inView)
      return true;
    let { top: top2 } = this.heightMap.lineAt(from, QueryType.ByPos, this.heightOracle, 0, 0);
    let { bottom } = this.heightMap.lineAt(to, QueryType.ByPos, this.heightOracle, 0, 0);
    let { visibleTop, visibleBottom } = this;
    return (from == 0 || top2 <= visibleTop - Math.max(10, Math.min(-bias, 250))) && (to == this.state.doc.length || bottom >= visibleBottom + Math.max(10, Math.min(bias, 250))) && (top2 > visibleTop - 2 * 1000 && bottom < visibleBottom + 2 * 1000);
  }
  mapLineGaps(gaps, changes) {
    if (!gaps.length || changes.empty)
      return gaps;
    let mapped = [];
    for (let gap of gaps)
      if (!changes.touchesRange(gap.from, gap.to))
        mapped.push(new LineGap(changes.mapPos(gap.from), changes.mapPos(gap.to), gap.size));
    return mapped;
  }
  ensureLineGaps(current, mayMeasure) {
    let wrapping = this.heightOracle.lineWrapping;
    let margin = wrapping ? 1e4 : 2000, halfMargin = margin >> 1, doubleMargin = margin << 1;
    if (this.defaultTextDirection != Direction.LTR && !wrapping)
      return [];
    let gaps = [];
    let addGap = (from, to, line, structure) => {
      if (to - from < halfMargin)
        return;
      let sel = this.state.selection.main, avoid = [sel.from];
      if (!sel.empty)
        avoid.push(sel.to);
      for (let pos of avoid) {
        if (pos > from && pos < to) {
          addGap(from, pos - 10, line, structure);
          addGap(pos + 10, to, line, structure);
          return;
        }
      }
      let gap = find(current, (gap2) => gap2.from >= line.from && gap2.to <= line.to && Math.abs(gap2.from - from) < halfMargin && Math.abs(gap2.to - to) < halfMargin && !avoid.some((pos) => gap2.from < pos && gap2.to > pos));
      if (!gap) {
        if (to < line.to && mayMeasure && wrapping && mayMeasure.visibleRanges.some((r) => r.from <= to && r.to >= to)) {
          let lineStart = mayMeasure.moveToLineBoundary(EditorSelection.cursor(to), false, true).head;
          if (lineStart > from)
            to = lineStart;
        }
        gap = new LineGap(from, to, this.gapSize(line, from, to, structure));
      }
      gaps.push(gap);
    };
    for (let line of this.viewportLines) {
      if (line.length < doubleMargin)
        continue;
      let structure = lineStructure(line.from, line.to, this.stateDeco);
      if (structure.total < doubleMargin)
        continue;
      let target = this.scrollTarget ? this.scrollTarget.range.head : null;
      let viewFrom, viewTo;
      if (wrapping) {
        let marginHeight = margin / this.heightOracle.lineLength * this.heightOracle.lineHeight;
        let top2, bot;
        if (target != null) {
          let targetFrac = findFraction(structure, target);
          let spaceFrac = ((this.visibleBottom - this.visibleTop) / 2 + marginHeight) / line.height;
          top2 = targetFrac - spaceFrac;
          bot = targetFrac + spaceFrac;
        } else {
          top2 = (this.visibleTop - line.top - marginHeight) / line.height;
          bot = (this.visibleBottom - line.top + marginHeight) / line.height;
        }
        viewFrom = findPosition(structure, top2);
        viewTo = findPosition(structure, bot);
      } else {
        let totalWidth = structure.total * this.heightOracle.charWidth;
        let marginWidth = margin * this.heightOracle.charWidth;
        let left, right;
        if (target != null) {
          let targetFrac = findFraction(structure, target);
          let spaceFrac = ((this.pixelViewport.right - this.pixelViewport.left) / 2 + marginWidth) / totalWidth;
          left = targetFrac - spaceFrac;
          right = targetFrac + spaceFrac;
        } else {
          left = (this.pixelViewport.left - marginWidth) / totalWidth;
          right = (this.pixelViewport.right + marginWidth) / totalWidth;
        }
        viewFrom = findPosition(structure, left);
        viewTo = findPosition(structure, right);
      }
      if (viewFrom > line.from)
        addGap(line.from, viewFrom, line, structure);
      if (viewTo < line.to)
        addGap(viewTo, line.to, line, structure);
    }
    return gaps;
  }
  gapSize(line, from, to, structure) {
    let fraction = findFraction(structure, to) - findFraction(structure, from);
    if (this.heightOracle.lineWrapping) {
      return line.height * fraction;
    } else {
      return structure.total * this.heightOracle.charWidth * fraction;
    }
  }
  updateLineGaps(gaps) {
    if (!LineGap.same(gaps, this.lineGaps)) {
      this.lineGaps = gaps;
      this.lineGapDeco = Decoration.set(gaps.map((gap) => gap.draw(this, this.heightOracle.lineWrapping)));
    }
  }
  computeVisibleRanges() {
    let deco = this.stateDeco;
    if (this.lineGaps.length)
      deco = deco.concat(this.lineGapDeco);
    let ranges = [];
    RangeSet.spans(deco, this.viewport.from, this.viewport.to, {
      span(from, to) {
        ranges.push({ from, to });
      },
      point() {
      }
    }, 20);
    let changed = ranges.length != this.visibleRanges.length || this.visibleRanges.some((r, i) => r.from != ranges[i].from || r.to != ranges[i].to);
    this.visibleRanges = ranges;
    return changed ? 4 : 0;
  }
  lineBlockAt(pos) {
    return pos >= this.viewport.from && pos <= this.viewport.to && this.viewportLines.find((b) => b.from <= pos && b.to >= pos) || scaleBlock(this.heightMap.lineAt(pos, QueryType.ByPos, this.heightOracle, 0, 0), this.scaler);
  }
  lineBlockAtHeight(height) {
    return scaleBlock(this.heightMap.lineAt(this.scaler.fromDOM(height), QueryType.ByHeight, this.heightOracle, 0, 0), this.scaler);
  }
  scrollAnchorAt(scrollTop) {
    let block = this.lineBlockAtHeight(scrollTop + 8);
    return block.from >= this.viewport.from || this.viewportLines[0].top - scrollTop > 200 ? block : this.viewportLines[0];
  }
  elementAtHeight(height) {
    return scaleBlock(this.heightMap.blockAt(this.scaler.fromDOM(height), this.heightOracle, 0, 0), this.scaler);
  }
  get docHeight() {
    return this.scaler.toDOM(this.heightMap.height);
  }
  get contentHeight() {
    return this.docHeight + this.paddingTop + this.paddingBottom;
  }
}

class Viewport {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }
}
var IdScaler = {
  toDOM(n) {
    return n;
  },
  fromDOM(n) {
    return n;
  },
  scale: 1
};

class BigScaler {
  constructor(oracle, heightMap, viewports) {
    let vpHeight = 0, base2 = 0, domBase = 0;
    this.viewports = viewports.map(({ from, to }) => {
      let top2 = heightMap.lineAt(from, QueryType.ByPos, oracle, 0, 0).top;
      let bottom = heightMap.lineAt(to, QueryType.ByPos, oracle, 0, 0).bottom;
      vpHeight += bottom - top2;
      return { from, to, top: top2, bottom, domTop: 0, domBottom: 0 };
    });
    this.scale = (7000000 - vpHeight) / (heightMap.height - vpHeight);
    for (let obj of this.viewports) {
      obj.domTop = domBase + (obj.top - base2) * this.scale;
      domBase = obj.domBottom = obj.domTop + (obj.bottom - obj.top);
      base2 = obj.bottom;
    }
  }
  toDOM(n) {
    for (let i = 0, base2 = 0, domBase = 0;; i++) {
      let vp = i < this.viewports.length ? this.viewports[i] : null;
      if (!vp || n < vp.top)
        return domBase + (n - base2) * this.scale;
      if (n <= vp.bottom)
        return vp.domTop + (n - vp.top);
      base2 = vp.bottom;
      domBase = vp.domBottom;
    }
  }
  fromDOM(n) {
    for (let i = 0, base2 = 0, domBase = 0;; i++) {
      let vp = i < this.viewports.length ? this.viewports[i] : null;
      if (!vp || n < vp.domTop)
        return base2 + (n - domBase) / this.scale;
      if (n <= vp.domBottom)
        return vp.top + (n - vp.domTop);
      base2 = vp.bottom;
      domBase = vp.domBottom;
    }
  }
}
var theme = Facet.define({ combine: (strs) => strs.join(" ") });
var darkTheme = Facet.define({ combine: (values) => values.indexOf(true) > -1 });
var baseThemeID = StyleModule.newName();
var baseLightID = StyleModule.newName();
var baseDarkID = StyleModule.newName();
var lightDarkIDs = { "&light": "." + baseLightID, "&dark": "." + baseDarkID };
var baseTheme$1 = buildTheme("." + baseThemeID, {
  "&": {
    position: "relative !important",
    boxSizing: "border-box",
    "&.cm-focused": {
      outline: "1px dotted #212121"
    },
    display: "flex !important",
    flexDirection: "column"
  },
  ".cm-scroller": {
    display: "flex !important",
    alignItems: "flex-start !important",
    fontFamily: "monospace",
    lineHeight: 1.4,
    height: "100%",
    overflowX: "auto",
    position: "relative",
    zIndex: 0
  },
  ".cm-content": {
    margin: 0,
    flexGrow: 2,
    flexShrink: 0,
    display: "block",
    whiteSpace: "pre",
    wordWrap: "normal",
    boxSizing: "border-box",
    padding: "4px 0",
    outline: "none",
    "&[contenteditable=true]": {
      WebkitUserModify: "read-write-plaintext-only"
    }
  },
  ".cm-lineWrapping": {
    whiteSpace_fallback: "pre-wrap",
    whiteSpace: "break-spaces",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    flexShrink: 1
  },
  "&light .cm-content": { caretColor: "black" },
  "&dark .cm-content": { caretColor: "white" },
  ".cm-line": {
    display: "block",
    padding: "0 2px 0 6px"
  },
  ".cm-layer": {
    position: "absolute",
    left: 0,
    top: 0,
    contain: "size style",
    "& > *": {
      position: "absolute"
    }
  },
  "&light .cm-selectionBackground": {
    background: "#d9d9d9"
  },
  "&dark .cm-selectionBackground": {
    background: "#222"
  },
  "&light.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
    background: "#d7d4f0"
  },
  "&dark.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
    background: "#233"
  },
  ".cm-cursorLayer": {
    pointerEvents: "none"
  },
  "&.cm-focused > .cm-scroller > .cm-cursorLayer": {
    animation: "steps(1) cm-blink 1.2s infinite"
  },
  "@keyframes cm-blink": { "0%": {}, "50%": { opacity: 0 }, "100%": {} },
  "@keyframes cm-blink2": { "0%": {}, "50%": { opacity: 0 }, "100%": {} },
  ".cm-cursor, .cm-dropCursor": {
    borderLeft: "1.2px solid black",
    marginLeft: "-0.6px",
    pointerEvents: "none"
  },
  ".cm-cursor": {
    display: "none"
  },
  "&dark .cm-cursor": {
    borderLeftColor: "#444"
  },
  ".cm-dropCursor": {
    position: "absolute"
  },
  "&.cm-focused > .cm-scroller > .cm-cursorLayer .cm-cursor": {
    display: "block"
  },
  "&light .cm-activeLine": { backgroundColor: "#cceeff44" },
  "&dark .cm-activeLine": { backgroundColor: "#99eeff33" },
  "&light .cm-specialChar": { color: "red" },
  "&dark .cm-specialChar": { color: "#f78" },
  ".cm-gutters": {
    flexShrink: 0,
    display: "flex",
    height: "100%",
    boxSizing: "border-box",
    insetInlineStart: 0,
    zIndex: 200
  },
  "&light .cm-gutters": {
    backgroundColor: "#f5f5f5",
    color: "#6c6c6c",
    borderRight: "1px solid #ddd"
  },
  "&dark .cm-gutters": {
    backgroundColor: "#333338",
    color: "#ccc"
  },
  ".cm-gutter": {
    display: "flex !important",
    flexDirection: "column",
    flexShrink: 0,
    boxSizing: "border-box",
    minHeight: "100%",
    overflow: "hidden"
  },
  ".cm-gutterElement": {
    boxSizing: "border-box"
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 3px 0 5px",
    minWidth: "20px",
    textAlign: "right",
    whiteSpace: "nowrap"
  },
  "&light .cm-activeLineGutter": {
    backgroundColor: "#e2f2ff"
  },
  "&dark .cm-activeLineGutter": {
    backgroundColor: "#222227"
  },
  ".cm-panels": {
    boxSizing: "border-box",
    position: "sticky",
    left: 0,
    right: 0
  },
  "&light .cm-panels": {
    backgroundColor: "#f5f5f5",
    color: "black"
  },
  "&light .cm-panels-top": {
    borderBottom: "1px solid #ddd"
  },
  "&light .cm-panels-bottom": {
    borderTop: "1px solid #ddd"
  },
  "&dark .cm-panels": {
    backgroundColor: "#333338",
    color: "white"
  },
  ".cm-tab": {
    display: "inline-block",
    overflow: "hidden",
    verticalAlign: "bottom"
  },
  ".cm-widgetBuffer": {
    verticalAlign: "text-top",
    height: "1em",
    width: 0,
    display: "inline"
  },
  ".cm-placeholder": {
    color: "#888",
    display: "inline-block",
    verticalAlign: "top"
  },
  ".cm-highlightSpace:before": {
    content: "attr(data-display)",
    position: "absolute",
    pointerEvents: "none",
    color: "#888"
  },
  ".cm-highlightTab": {
    backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20"><path stroke="%23888" stroke-width="1" fill="none" d="M1 10H196L190 5M190 15L196 10M197 4L197 16"/></svg>')`,
    backgroundSize: "auto 100%",
    backgroundPosition: "right 90%",
    backgroundRepeat: "no-repeat"
  },
  ".cm-trailingSpace": {
    backgroundColor: "#ff332255"
  },
  ".cm-button": {
    verticalAlign: "middle",
    color: "inherit",
    fontSize: "70%",
    padding: ".2em 1em",
    borderRadius: "1px"
  },
  "&light .cm-button": {
    backgroundImage: "linear-gradient(#eff1f5, #d9d9df)",
    border: "1px solid #888",
    "&:active": {
      backgroundImage: "linear-gradient(#b4b4b4, #d0d3d6)"
    }
  },
  "&dark .cm-button": {
    backgroundImage: "linear-gradient(#393939, #111)",
    border: "1px solid #888",
    "&:active": {
      backgroundImage: "linear-gradient(#111, #333)"
    }
  },
  ".cm-textfield": {
    verticalAlign: "middle",
    color: "inherit",
    fontSize: "70%",
    border: "1px solid silver",
    padding: ".2em .5em"
  },
  "&light .cm-textfield": {
    backgroundColor: "white"
  },
  "&dark .cm-textfield": {
    border: "1px solid #555",
    backgroundColor: "inherit"
  }
}, lightDarkIDs);
var LineBreakPlaceholder = "\uFFFF";

class DOMReader {
  constructor(points, state2) {
    this.points = points;
    this.text = "";
    this.lineSeparator = state2.facet(EditorState.lineSeparator);
  }
  append(text) {
    this.text += text;
  }
  lineBreak() {
    this.text += LineBreakPlaceholder;
  }
  readRange(start, end) {
    if (!start)
      return this;
    let parent = start.parentNode;
    for (let cur = start;; ) {
      this.findPointBefore(parent, cur);
      let oldLen = this.text.length;
      this.readNode(cur);
      let next = cur.nextSibling;
      if (next == end)
        break;
      let view = ContentView.get(cur), nextView = ContentView.get(next);
      if (view && nextView ? view.breakAfter : (view ? view.breakAfter : isBlockElement(cur)) || isBlockElement(next) && (cur.nodeName != "BR" || cur.cmIgnore) && this.text.length > oldLen)
        this.lineBreak();
      cur = next;
    }
    this.findPointBefore(parent, end);
    return this;
  }
  readTextNode(node) {
    let text = node.nodeValue;
    for (let point of this.points)
      if (point.node == node)
        point.pos = this.text.length + Math.min(point.offset, text.length);
    for (let off = 0, re = this.lineSeparator ? null : /\r\n?|\n/g;; ) {
      let nextBreak = -1, breakSize = 1, m;
      if (this.lineSeparator) {
        nextBreak = text.indexOf(this.lineSeparator, off);
        breakSize = this.lineSeparator.length;
      } else if (m = re.exec(text)) {
        nextBreak = m.index;
        breakSize = m[0].length;
      }
      this.append(text.slice(off, nextBreak < 0 ? text.length : nextBreak));
      if (nextBreak < 0)
        break;
      this.lineBreak();
      if (breakSize > 1) {
        for (let point of this.points)
          if (point.node == node && point.pos > this.text.length)
            point.pos -= breakSize - 1;
      }
      off = nextBreak + breakSize;
    }
  }
  readNode(node) {
    if (node.cmIgnore)
      return;
    let view = ContentView.get(node);
    let fromView = view && view.overrideDOMText;
    if (fromView != null) {
      this.findPointInside(node, fromView.length);
      for (let i = fromView.iter();!i.next().done; ) {
        if (i.lineBreak)
          this.lineBreak();
        else
          this.append(i.value);
      }
    } else if (node.nodeType == 3) {
      this.readTextNode(node);
    } else if (node.nodeName == "BR") {
      if (node.nextSibling)
        this.lineBreak();
    } else if (node.nodeType == 1) {
      this.readRange(node.firstChild, null);
    }
  }
  findPointBefore(node, next) {
    for (let point of this.points)
      if (point.node == node && node.childNodes[point.offset] == next)
        point.pos = this.text.length;
  }
  findPointInside(node, maxLen) {
    for (let point of this.points)
      if (node.nodeType == 3 ? point.node == node : node.contains(point.node))
        point.pos = this.text.length + Math.min(maxLen, point.offset);
  }
}

class DOMPoint {
  constructor(node, offset) {
    this.node = node;
    this.offset = offset;
    this.pos = -1;
  }
}

class DOMChange {
  constructor(view, start, end, typeOver) {
    this.typeOver = typeOver;
    this.bounds = null;
    this.text = "";
    let { impreciseHead: iHead, impreciseAnchor: iAnchor } = view.docView;
    if (view.state.readOnly && start > -1) {
      this.newSel = null;
    } else if (start > -1 && (this.bounds = view.docView.domBoundsAround(start, end, 0))) {
      let selPoints = iHead || iAnchor ? [] : selectionPoints(view);
      let reader = new DOMReader(selPoints, view.state);
      reader.readRange(this.bounds.startDOM, this.bounds.endDOM);
      this.text = reader.text;
      this.newSel = selectionFromPoints(selPoints, this.bounds.from);
    } else {
      let domSel = view.observer.selectionRange;
      let head = iHead && iHead.node == domSel.focusNode && iHead.offset == domSel.focusOffset || !contains(view.contentDOM, domSel.focusNode) ? view.state.selection.main.head : view.docView.posFromDOM(domSel.focusNode, domSel.focusOffset);
      let anchor = iAnchor && iAnchor.node == domSel.anchorNode && iAnchor.offset == domSel.anchorOffset || !contains(view.contentDOM, domSel.anchorNode) ? view.state.selection.main.anchor : view.docView.posFromDOM(domSel.anchorNode, domSel.anchorOffset);
      this.newSel = EditorSelection.single(anchor, head);
    }
  }
}
var observeOptions = {
  childList: true,
  characterData: true,
  subtree: true,
  attributes: true,
  characterDataOldValue: true
};
var useCharData = browser.ie && browser.ie_version <= 11;

class DOMObserver {
  constructor(view) {
    this.view = view;
    this.active = false;
    this.selectionRange = new DOMSelectionState;
    this.selectionChanged = false;
    this.delayedFlush = -1;
    this.resizeTimeout = -1;
    this.queue = [];
    this.delayedAndroidKey = null;
    this.flushingAndroidKey = -1;
    this.lastChange = 0;
    this.scrollTargets = [];
    this.intersection = null;
    this.resizeScroll = null;
    this.resizeContent = null;
    this.intersecting = false;
    this.gapIntersection = null;
    this.gaps = [];
    this.parentCheck = -1;
    this.dom = view.contentDOM;
    this.observer = new MutationObserver((mutations) => {
      for (let mut of mutations)
        this.queue.push(mut);
      if ((browser.ie && browser.ie_version <= 11 || browser.ios && view.composing) && mutations.some((m) => m.type == "childList" && m.removedNodes.length || m.type == "characterData" && m.oldValue.length > m.target.nodeValue.length))
        this.flushSoon();
      else
        this.flush();
    });
    if (useCharData)
      this.onCharData = (event) => {
        this.queue.push({
          target: event.target,
          type: "characterData",
          oldValue: event.prevValue
        });
        this.flushSoon();
      };
    this.onSelectionChange = this.onSelectionChange.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onPrint = this.onPrint.bind(this);
    this.onScroll = this.onScroll.bind(this);
    if (typeof ResizeObserver == "function") {
      this.resizeScroll = new ResizeObserver(() => {
        var _a;
        if (((_a = this.view.docView) === null || _a === undefined ? undefined : _a.lastUpdate) < Date.now() - 75)
          this.onResize();
      });
      this.resizeScroll.observe(view.scrollDOM);
      this.resizeContent = new ResizeObserver(() => this.view.requestMeasure());
      this.resizeContent.observe(view.contentDOM);
    }
    this.addWindowListeners(this.win = view.win);
    this.start();
    if (typeof IntersectionObserver == "function") {
      this.intersection = new IntersectionObserver((entries) => {
        if (this.parentCheck < 0)
          this.parentCheck = setTimeout(this.listenForScroll.bind(this), 1000);
        if (entries.length > 0 && entries[entries.length - 1].intersectionRatio > 0 != this.intersecting) {
          this.intersecting = !this.intersecting;
          if (this.intersecting != this.view.inView)
            this.onScrollChanged(document.createEvent("Event"));
        }
      }, { threshold: [0, 0.001] });
      this.intersection.observe(this.dom);
      this.gapIntersection = new IntersectionObserver((entries) => {
        if (entries.length > 0 && entries[entries.length - 1].intersectionRatio > 0)
          this.onScrollChanged(document.createEvent("Event"));
      }, {});
    }
    this.listenForScroll();
    this.readSelectionRange();
  }
  onScrollChanged(e) {
    this.view.inputState.runScrollHandlers(this.view, e);
    if (this.intersecting)
      this.view.measure();
  }
  onScroll(e) {
    if (this.intersecting)
      this.flush(false);
    this.onScrollChanged(e);
  }
  onResize() {
    if (this.resizeTimeout < 0)
      this.resizeTimeout = setTimeout(() => {
        this.resizeTimeout = -1;
        this.view.requestMeasure();
      }, 50);
  }
  onPrint() {
    this.view.viewState.printing = true;
    this.view.measure();
    setTimeout(() => {
      this.view.viewState.printing = false;
      this.view.requestMeasure();
    }, 500);
  }
  updateGaps(gaps) {
    if (this.gapIntersection && (gaps.length != this.gaps.length || this.gaps.some((g, i) => g != gaps[i]))) {
      this.gapIntersection.disconnect();
      for (let gap of gaps)
        this.gapIntersection.observe(gap);
      this.gaps = gaps;
    }
  }
  onSelectionChange(event) {
    let wasChanged = this.selectionChanged;
    if (!this.readSelectionRange() || this.delayedAndroidKey)
      return;
    let { view } = this, sel = this.selectionRange;
    if (view.state.facet(editable) ? view.root.activeElement != this.dom : !hasSelection(view.dom, sel))
      return;
    let context = sel.anchorNode && view.docView.nearest(sel.anchorNode);
    if (context && context.ignoreEvent(event)) {
      if (!wasChanged)
        this.selectionChanged = false;
      return;
    }
    if ((browser.ie && browser.ie_version <= 11 || browser.android && browser.chrome) && !view.state.selection.main.empty && sel.focusNode && isEquivalentPosition(sel.focusNode, sel.focusOffset, sel.anchorNode, sel.anchorOffset))
      this.flushSoon();
    else
      this.flush(false);
  }
  readSelectionRange() {
    let { view } = this;
    let range = browser.safari && view.root.nodeType == 11 && deepActiveElement(this.dom.ownerDocument) == this.dom && safariSelectionRangeHack(this.view) || getSelection(view.root);
    if (!range || this.selectionRange.eq(range))
      return false;
    let local = hasSelection(this.dom, range);
    if (local && !this.selectionChanged && view.inputState.lastFocusTime > Date.now() - 200 && view.inputState.lastTouchTime < Date.now() - 300 && atElementStart(this.dom, range)) {
      this.view.inputState.lastFocusTime = 0;
      view.docView.updateSelection();
      return false;
    }
    this.selectionRange.setRange(range);
    if (local)
      this.selectionChanged = true;
    return true;
  }
  setSelectionRange(anchor, head) {
    this.selectionRange.set(anchor.node, anchor.offset, head.node, head.offset);
    this.selectionChanged = false;
  }
  clearSelectionRange() {
    this.selectionRange.set(null, 0, null, 0);
  }
  listenForScroll() {
    this.parentCheck = -1;
    let i = 0, changed = null;
    for (let dom = this.dom;dom; ) {
      if (dom.nodeType == 1) {
        if (!changed && i < this.scrollTargets.length && this.scrollTargets[i] == dom)
          i++;
        else if (!changed)
          changed = this.scrollTargets.slice(0, i);
        if (changed)
          changed.push(dom);
        dom = dom.assignedSlot || dom.parentNode;
      } else if (dom.nodeType == 11) {
        dom = dom.host;
      } else {
        break;
      }
    }
    if (i < this.scrollTargets.length && !changed)
      changed = this.scrollTargets.slice(0, i);
    if (changed) {
      for (let dom of this.scrollTargets)
        dom.removeEventListener("scroll", this.onScroll);
      for (let dom of this.scrollTargets = changed)
        dom.addEventListener("scroll", this.onScroll);
    }
  }
  ignore(f) {
    if (!this.active)
      return f();
    try {
      this.stop();
      return f();
    } finally {
      this.start();
      this.clear();
    }
  }
  start() {
    if (this.active)
      return;
    this.observer.observe(this.dom, observeOptions);
    if (useCharData)
      this.dom.addEventListener("DOMCharacterDataModified", this.onCharData);
    this.active = true;
  }
  stop() {
    if (!this.active)
      return;
    this.active = false;
    this.observer.disconnect();
    if (useCharData)
      this.dom.removeEventListener("DOMCharacterDataModified", this.onCharData);
  }
  clear() {
    this.processRecords();
    this.queue.length = 0;
    this.selectionChanged = false;
  }
  delayAndroidKey(key, keyCode) {
    var _a;
    if (!this.delayedAndroidKey) {
      let flush = () => {
        let key2 = this.delayedAndroidKey;
        if (key2) {
          this.clearDelayedAndroidKey();
          this.view.inputState.lastKeyCode = key2.keyCode;
          this.view.inputState.lastKeyTime = Date.now();
          let flushed = this.flush();
          if (!flushed && key2.force)
            dispatchKey(this.dom, key2.key, key2.keyCode);
        }
      };
      this.flushingAndroidKey = this.view.win.requestAnimationFrame(flush);
    }
    if (!this.delayedAndroidKey || key == "Enter")
      this.delayedAndroidKey = {
        key,
        keyCode,
        force: this.lastChange < Date.now() - 50 || !!((_a = this.delayedAndroidKey) === null || _a === undefined ? undefined : _a.force)
      };
  }
  clearDelayedAndroidKey() {
    this.win.cancelAnimationFrame(this.flushingAndroidKey);
    this.delayedAndroidKey = null;
    this.flushingAndroidKey = -1;
  }
  flushSoon() {
    if (this.delayedFlush < 0)
      this.delayedFlush = this.view.win.requestAnimationFrame(() => {
        this.delayedFlush = -1;
        this.flush();
      });
  }
  forceFlush() {
    if (this.delayedFlush >= 0) {
      this.view.win.cancelAnimationFrame(this.delayedFlush);
      this.delayedFlush = -1;
    }
    this.flush();
  }
  pendingRecords() {
    for (let mut of this.observer.takeRecords())
      this.queue.push(mut);
    return this.queue;
  }
  processRecords() {
    let records = this.pendingRecords();
    if (records.length)
      this.queue = [];
    let from = -1, to = -1, typeOver = false;
    for (let record of records) {
      let range = this.readMutation(record);
      if (!range)
        continue;
      if (range.typeOver)
        typeOver = true;
      if (from == -1) {
        ({ from, to } = range);
      } else {
        from = Math.min(range.from, from);
        to = Math.max(range.to, to);
      }
    }
    return { from, to, typeOver };
  }
  readChange() {
    let { from, to, typeOver } = this.processRecords();
    let newSel = this.selectionChanged && hasSelection(this.dom, this.selectionRange);
    if (from < 0 && !newSel)
      return null;
    if (from > -1)
      this.lastChange = Date.now();
    this.view.inputState.lastFocusTime = 0;
    this.selectionChanged = false;
    let change = new DOMChange(this.view, from, to, typeOver);
    this.view.docView.domChanged = { newSel: change.newSel ? change.newSel.main : null };
    return change;
  }
  flush(readSelection = true) {
    if (this.delayedFlush >= 0 || this.delayedAndroidKey)
      return false;
    if (readSelection)
      this.readSelectionRange();
    let domChange = this.readChange();
    if (!domChange)
      return false;
    let startState = this.view.state;
    let handled = applyDOMChange(this.view, domChange);
    if (this.view.state == startState)
      this.view.update([]);
    return handled;
  }
  readMutation(rec) {
    let cView = this.view.docView.nearest(rec.target);
    if (!cView || cView.ignoreMutation(rec))
      return null;
    cView.markDirty(rec.type == "attributes");
    if (rec.type == "attributes")
      cView.flags |= 4;
    if (rec.type == "childList") {
      let childBefore = findChild(cView, rec.previousSibling || rec.target.previousSibling, -1);
      let childAfter = findChild(cView, rec.nextSibling || rec.target.nextSibling, 1);
      return {
        from: childBefore ? cView.posAfter(childBefore) : cView.posAtStart,
        to: childAfter ? cView.posBefore(childAfter) : cView.posAtEnd,
        typeOver: false
      };
    } else if (rec.type == "characterData") {
      return { from: cView.posAtStart, to: cView.posAtEnd, typeOver: rec.target.nodeValue == rec.oldValue };
    } else {
      return null;
    }
  }
  setWindow(win) {
    if (win != this.win) {
      this.removeWindowListeners(this.win);
      this.win = win;
      this.addWindowListeners(this.win);
    }
  }
  addWindowListeners(win) {
    win.addEventListener("resize", this.onResize);
    win.addEventListener("beforeprint", this.onPrint);
    win.addEventListener("scroll", this.onScroll);
    win.document.addEventListener("selectionchange", this.onSelectionChange);
  }
  removeWindowListeners(win) {
    win.removeEventListener("scroll", this.onScroll);
    win.removeEventListener("resize", this.onResize);
    win.removeEventListener("beforeprint", this.onPrint);
    win.document.removeEventListener("selectionchange", this.onSelectionChange);
  }
  destroy() {
    var _a, _b, _c, _d;
    this.stop();
    (_a = this.intersection) === null || _a === undefined || _a.disconnect();
    (_b = this.gapIntersection) === null || _b === undefined || _b.disconnect();
    (_c = this.resizeScroll) === null || _c === undefined || _c.disconnect();
    (_d = this.resizeContent) === null || _d === undefined || _d.disconnect();
    for (let dom of this.scrollTargets)
      dom.removeEventListener("scroll", this.onScroll);
    this.removeWindowListeners(this.win);
    clearTimeout(this.parentCheck);
    clearTimeout(this.resizeTimeout);
    this.win.cancelAnimationFrame(this.delayedFlush);
    this.win.cancelAnimationFrame(this.flushingAndroidKey);
  }
}

class EditorView {
  get state() {
    return this.viewState.state;
  }
  get viewport() {
    return this.viewState.viewport;
  }
  get visibleRanges() {
    return this.viewState.visibleRanges;
  }
  get inView() {
    return this.viewState.inView;
  }
  get composing() {
    return this.inputState.composing > 0;
  }
  get compositionStarted() {
    return this.inputState.composing >= 0;
  }
  get root() {
    return this._root;
  }
  get win() {
    return this.dom.ownerDocument.defaultView || window;
  }
  constructor(config = {}) {
    this.plugins = [];
    this.pluginMap = new Map;
    this.editorAttrs = {};
    this.contentAttrs = {};
    this.bidiCache = [];
    this.destroyed = false;
    this.updateState = 2;
    this.measureScheduled = -1;
    this.measureRequests = [];
    this.contentDOM = document.createElement("div");
    this.scrollDOM = document.createElement("div");
    this.scrollDOM.tabIndex = -1;
    this.scrollDOM.className = "cm-scroller";
    this.scrollDOM.appendChild(this.contentDOM);
    this.announceDOM = document.createElement("div");
    this.announceDOM.style.cssText = "position: fixed; top: -10000px";
    this.announceDOM.setAttribute("aria-live", "polite");
    this.dom = document.createElement("div");
    this.dom.appendChild(this.announceDOM);
    this.dom.appendChild(this.scrollDOM);
    let { dispatch } = config;
    this.dispatchTransactions = config.dispatchTransactions || dispatch && ((trs) => trs.forEach((tr) => dispatch(tr, this))) || ((trs) => this.update(trs));
    this.dispatch = this.dispatch.bind(this);
    this._root = config.root || getRoot(config.parent) || document;
    this.viewState = new ViewState(config.state || EditorState.create(config));
    this.plugins = this.state.facet(viewPlugin).map((spec) => new PluginInstance(spec));
    for (let plugin of this.plugins)
      plugin.update(this);
    this.observer = new DOMObserver(this);
    this.inputState = new InputState(this);
    this.inputState.ensureHandlers(this, this.plugins);
    this.docView = new DocView(this);
    this.mountStyles();
    this.updateAttrs();
    this.updateState = 0;
    this.requestMeasure();
    if (config.parent)
      config.parent.appendChild(this.dom);
  }
  dispatch(...input) {
    let trs = input.length == 1 && input[0] instanceof Transaction ? input : input.length == 1 && Array.isArray(input[0]) ? input[0] : [this.state.update(...input)];
    this.dispatchTransactions(trs, this);
  }
  update(transactions) {
    if (this.updateState != 0)
      throw new Error("Calls to EditorView.update are not allowed while an update is in progress");
    let redrawn = false, attrsChanged = false, update;
    let state2 = this.state;
    for (let tr of transactions) {
      if (tr.startState != state2)
        throw new RangeError("Trying to update state with a transaction that doesn't start from the previous state.");
      state2 = tr.state;
    }
    if (this.destroyed) {
      this.viewState.state = state2;
      return;
    }
    let focus = this.hasFocus, focusFlag = 0, dispatchFocus = null;
    if (transactions.some((tr) => tr.annotation(isFocusChange))) {
      this.inputState.notifiedFocused = focus;
      focusFlag = 1;
    } else if (focus != this.inputState.notifiedFocused) {
      this.inputState.notifiedFocused = focus;
      dispatchFocus = focusChangeTransaction(state2, focus);
      if (!dispatchFocus)
        focusFlag = 1;
    }
    let pendingKey = this.observer.delayedAndroidKey, domChange = null;
    if (pendingKey) {
      this.observer.clearDelayedAndroidKey();
      domChange = this.observer.readChange();
      if (domChange && !this.state.doc.eq(state2.doc) || !this.state.selection.eq(state2.selection))
        domChange = null;
    } else {
      this.observer.clear();
    }
    if (state2.facet(EditorState.phrases) != this.state.facet(EditorState.phrases))
      return this.setState(state2);
    update = ViewUpdate.create(this, state2, transactions);
    update.flags |= focusFlag;
    let scrollTarget = this.viewState.scrollTarget;
    try {
      this.updateState = 2;
      for (let tr of transactions) {
        if (scrollTarget)
          scrollTarget = scrollTarget.map(tr.changes);
        if (tr.scrollIntoView) {
          let { main } = tr.state.selection;
          scrollTarget = new ScrollTarget(main.empty ? main : EditorSelection.cursor(main.head, main.head > main.anchor ? -1 : 1));
        }
        for (let e of tr.effects)
          if (e.is(scrollIntoView))
            scrollTarget = e.value;
      }
      this.viewState.update(update, scrollTarget);
      this.bidiCache = CachedOrder.update(this.bidiCache, update.changes);
      if (!update.empty) {
        this.updatePlugins(update);
        this.inputState.update(update);
      }
      redrawn = this.docView.update(update);
      if (this.state.facet(styleModule) != this.styleModules)
        this.mountStyles();
      attrsChanged = this.updateAttrs();
      this.showAnnouncements(transactions);
      this.docView.updateSelection(redrawn, transactions.some((tr) => tr.isUserEvent("select.pointer")));
    } finally {
      this.updateState = 0;
    }
    if (update.startState.facet(theme) != update.state.facet(theme))
      this.viewState.mustMeasureContent = true;
    if (redrawn || attrsChanged || scrollTarget || this.viewState.mustEnforceCursorAssoc || this.viewState.mustMeasureContent)
      this.requestMeasure();
    if (!update.empty)
      for (let listener of this.state.facet(updateListener))
        listener(update);
    if (dispatchFocus || domChange)
      Promise.resolve().then(() => {
        if (dispatchFocus && this.state == dispatchFocus.startState)
          this.dispatch(dispatchFocus);
        if (domChange) {
          if (!applyDOMChange(this, domChange) && pendingKey.force)
            dispatchKey(this.contentDOM, pendingKey.key, pendingKey.keyCode);
        }
      });
  }
  setState(newState) {
    if (this.updateState != 0)
      throw new Error("Calls to EditorView.setState are not allowed while an update is in progress");
    if (this.destroyed) {
      this.viewState.state = newState;
      return;
    }
    this.updateState = 2;
    let hadFocus = this.hasFocus;
    try {
      for (let plugin of this.plugins)
        plugin.destroy(this);
      this.viewState = new ViewState(newState);
      this.plugins = newState.facet(viewPlugin).map((spec) => new PluginInstance(spec));
      this.pluginMap.clear();
      for (let plugin of this.plugins)
        plugin.update(this);
      this.docView = new DocView(this);
      this.inputState.ensureHandlers(this, this.plugins);
      this.mountStyles();
      this.updateAttrs();
      this.bidiCache = [];
    } finally {
      this.updateState = 0;
    }
    if (hadFocus)
      this.focus();
    this.requestMeasure();
  }
  updatePlugins(update) {
    let prevSpecs = update.startState.facet(viewPlugin), specs = update.state.facet(viewPlugin);
    if (prevSpecs != specs) {
      let newPlugins = [];
      for (let spec of specs) {
        let found = prevSpecs.indexOf(spec);
        if (found < 0) {
          newPlugins.push(new PluginInstance(spec));
        } else {
          let plugin = this.plugins[found];
          plugin.mustUpdate = update;
          newPlugins.push(plugin);
        }
      }
      for (let plugin of this.plugins)
        if (plugin.mustUpdate != update)
          plugin.destroy(this);
      this.plugins = newPlugins;
      this.pluginMap.clear();
      this.inputState.ensureHandlers(this, this.plugins);
    } else {
      for (let p of this.plugins)
        p.mustUpdate = update;
    }
    for (let i = 0;i < this.plugins.length; i++)
      this.plugins[i].update(this);
  }
  measure(flush = true) {
    if (this.destroyed)
      return;
    if (this.measureScheduled > -1)
      this.win.cancelAnimationFrame(this.measureScheduled);
    if (this.observer.delayedAndroidKey) {
      this.measureScheduled = -1;
      this.requestMeasure();
      return;
    }
    this.measureScheduled = 0;
    if (flush)
      this.observer.forceFlush();
    let updated = null;
    let sDOM = this.scrollDOM, scrollTop = sDOM.scrollTop * this.scaleY;
    let { scrollAnchorPos, scrollAnchorHeight } = this.viewState;
    if (Math.abs(scrollTop - this.viewState.scrollTop) > 1)
      scrollAnchorHeight = -1;
    this.viewState.scrollAnchorHeight = -1;
    try {
      for (let i = 0;; i++) {
        if (scrollAnchorHeight < 0) {
          if (isScrolledToBottom(sDOM)) {
            scrollAnchorPos = -1;
            scrollAnchorHeight = this.viewState.heightMap.height;
          } else {
            let block = this.viewState.scrollAnchorAt(scrollTop);
            scrollAnchorPos = block.from;
            scrollAnchorHeight = block.top;
          }
        }
        this.updateState = 1;
        let changed = this.viewState.measure(this);
        if (!changed && !this.measureRequests.length && this.viewState.scrollTarget == null)
          break;
        if (i > 5) {
          console.warn(this.measureRequests.length ? "Measure loop restarted more than 5 times" : "Viewport failed to stabilize");
          break;
        }
        let measuring = [];
        if (!(changed & 4))
          [this.measureRequests, measuring] = [measuring, this.measureRequests];
        let measured = measuring.map((m) => {
          try {
            return m.read(this);
          } catch (e) {
            logException(this.state, e);
            return BadMeasure;
          }
        });
        let update = ViewUpdate.create(this, this.state, []), redrawn = false;
        update.flags |= changed;
        if (!updated)
          updated = update;
        else
          updated.flags |= changed;
        this.updateState = 2;
        if (!update.empty) {
          this.updatePlugins(update);
          this.inputState.update(update);
          this.updateAttrs();
          redrawn = this.docView.update(update);
        }
        for (let i2 = 0;i2 < measuring.length; i2++)
          if (measured[i2] != BadMeasure) {
            try {
              let m = measuring[i2];
              if (m.write)
                m.write(measured[i2], this);
            } catch (e) {
              logException(this.state, e);
            }
          }
        if (redrawn)
          this.docView.updateSelection(true);
        if (!update.viewportChanged && this.measureRequests.length == 0) {
          if (this.viewState.editorHeight) {
            if (this.viewState.scrollTarget) {
              this.docView.scrollIntoView(this.viewState.scrollTarget);
              this.viewState.scrollTarget = null;
              continue;
            } else {
              let newAnchorHeight = scrollAnchorPos < 0 ? this.viewState.heightMap.height : this.viewState.lineBlockAt(scrollAnchorPos).top;
              let diff = newAnchorHeight - scrollAnchorHeight;
              if (diff > 1 || diff < -1) {
                scrollTop = scrollTop + diff;
                sDOM.scrollTop = scrollTop / this.scaleY;
                scrollAnchorHeight = -1;
                continue;
              }
            }
          }
          break;
        }
      }
    } finally {
      this.updateState = 0;
      this.measureScheduled = -1;
    }
    if (updated && !updated.empty)
      for (let listener of this.state.facet(updateListener))
        listener(updated);
  }
  get themeClasses() {
    return baseThemeID + " " + (this.state.facet(darkTheme) ? baseDarkID : baseLightID) + " " + this.state.facet(theme);
  }
  updateAttrs() {
    let editorAttrs = attrsFromFacet(this, editorAttributes, {
      class: "cm-editor" + (this.hasFocus ? " cm-focused " : " ") + this.themeClasses
    });
    let contentAttrs = {
      spellcheck: "false",
      autocorrect: "off",
      autocapitalize: "off",
      translate: "no",
      contenteditable: !this.state.facet(editable) ? "false" : "true",
      class: "cm-content",
      style: `${browser.tabSize}: ${this.state.tabSize}`,
      role: "textbox",
      "aria-multiline": "true"
    };
    if (this.state.readOnly)
      contentAttrs["aria-readonly"] = "true";
    attrsFromFacet(this, contentAttributes, contentAttrs);
    let changed = this.observer.ignore(() => {
      let changedContent = updateAttrs(this.contentDOM, this.contentAttrs, contentAttrs);
      let changedEditor = updateAttrs(this.dom, this.editorAttrs, editorAttrs);
      return changedContent || changedEditor;
    });
    this.editorAttrs = editorAttrs;
    this.contentAttrs = contentAttrs;
    return changed;
  }
  showAnnouncements(trs) {
    let first = true;
    for (let tr of trs)
      for (let effect of tr.effects)
        if (effect.is(EditorView.announce)) {
          if (first)
            this.announceDOM.textContent = "";
          first = false;
          let div = this.announceDOM.appendChild(document.createElement("div"));
          div.textContent = effect.value;
        }
  }
  mountStyles() {
    this.styleModules = this.state.facet(styleModule);
    let nonce = this.state.facet(EditorView.cspNonce);
    StyleModule.mount(this.root, this.styleModules.concat(baseTheme$1).reverse(), nonce ? { nonce } : undefined);
  }
  readMeasured() {
    if (this.updateState == 2)
      throw new Error("Reading the editor layout isn't allowed during an update");
    if (this.updateState == 0 && this.measureScheduled > -1)
      this.measure(false);
  }
  requestMeasure(request) {
    if (this.measureScheduled < 0)
      this.measureScheduled = this.win.requestAnimationFrame(() => this.measure());
    if (request) {
      if (this.measureRequests.indexOf(request) > -1)
        return;
      if (request.key != null)
        for (let i = 0;i < this.measureRequests.length; i++) {
          if (this.measureRequests[i].key === request.key) {
            this.measureRequests[i] = request;
            return;
          }
        }
      this.measureRequests.push(request);
    }
  }
  plugin(plugin) {
    let known = this.pluginMap.get(plugin);
    if (known === undefined || known && known.spec != plugin)
      this.pluginMap.set(plugin, known = this.plugins.find((p) => p.spec == plugin) || null);
    return known && known.update(this).value;
  }
  get documentTop() {
    return this.contentDOM.getBoundingClientRect().top + this.viewState.paddingTop;
  }
  get documentPadding() {
    return { top: this.viewState.paddingTop, bottom: this.viewState.paddingBottom };
  }
  get scaleX() {
    return this.viewState.scaleX;
  }
  get scaleY() {
    return this.viewState.scaleY;
  }
  elementAtHeight(height) {
    this.readMeasured();
    return this.viewState.elementAtHeight(height);
  }
  lineBlockAtHeight(height) {
    this.readMeasured();
    return this.viewState.lineBlockAtHeight(height);
  }
  get viewportLineBlocks() {
    return this.viewState.viewportLines;
  }
  lineBlockAt(pos) {
    return this.viewState.lineBlockAt(pos);
  }
  get contentHeight() {
    return this.viewState.contentHeight;
  }
  moveByChar(start, forward, by) {
    return skipAtoms(this, start, moveByChar(this, start, forward, by));
  }
  moveByGroup(start, forward) {
    return skipAtoms(this, start, moveByChar(this, start, forward, (initial) => byGroup(this, start.head, initial)));
  }
  moveToLineBoundary(start, forward, includeWrap = true) {
    return moveToLineBoundary(this, start, forward, includeWrap);
  }
  moveVertically(start, forward, distance) {
    return skipAtoms(this, start, moveVertically(this, start, forward, distance));
  }
  domAtPos(pos) {
    return this.docView.domAtPos(pos);
  }
  posAtDOM(node, offset = 0) {
    return this.docView.posFromDOM(node, offset);
  }
  posAtCoords(coords, precise = true) {
    this.readMeasured();
    return posAtCoords(this, coords, precise);
  }
  coordsAtPos(pos, side = 1) {
    this.readMeasured();
    let rect = this.docView.coordsAt(pos, side);
    if (!rect || rect.left == rect.right)
      return rect;
    let line = this.state.doc.lineAt(pos), order = this.bidiSpans(line);
    let span = order[BidiSpan.find(order, pos - line.from, -1, side)];
    return flattenRect(rect, span.dir == Direction.LTR == side > 0);
  }
  coordsForChar(pos) {
    this.readMeasured();
    return this.docView.coordsForChar(pos);
  }
  get defaultCharacterWidth() {
    return this.viewState.heightOracle.charWidth;
  }
  get defaultLineHeight() {
    return this.viewState.heightOracle.lineHeight;
  }
  get textDirection() {
    return this.viewState.defaultTextDirection;
  }
  textDirectionAt(pos) {
    let perLine = this.state.facet(perLineTextDirection);
    if (!perLine || pos < this.viewport.from || pos > this.viewport.to)
      return this.textDirection;
    this.readMeasured();
    return this.docView.textDirectionAt(pos);
  }
  get lineWrapping() {
    return this.viewState.heightOracle.lineWrapping;
  }
  bidiSpans(line) {
    if (line.length > MaxBidiLine)
      return trivialOrder(line.length);
    let dir = this.textDirectionAt(line.from), isolates;
    for (let entry of this.bidiCache) {
      if (entry.from == line.from && entry.dir == dir && (entry.fresh || isolatesEq(entry.isolates, isolates = getIsolatedRanges(this, line.from, line.to))))
        return entry.order;
    }
    if (!isolates)
      isolates = getIsolatedRanges(this, line.from, line.to);
    let order = computeOrder(line.text, dir, isolates);
    this.bidiCache.push(new CachedOrder(line.from, line.to, dir, isolates, true, order));
    return order;
  }
  get hasFocus() {
    var _a;
    return (this.dom.ownerDocument.hasFocus() || browser.safari && ((_a = this.inputState) === null || _a === undefined ? undefined : _a.lastContextMenu) > Date.now() - 30000) && this.root.activeElement == this.contentDOM;
  }
  focus() {
    this.observer.ignore(() => {
      focusPreventScroll(this.contentDOM);
      this.docView.updateSelection();
    });
  }
  setRoot(root) {
    if (this._root != root) {
      this._root = root;
      this.observer.setWindow((root.nodeType == 9 ? root : root.ownerDocument).defaultView || window);
      this.mountStyles();
    }
  }
  destroy() {
    for (let plugin of this.plugins)
      plugin.destroy(this);
    this.plugins = [];
    this.inputState.destroy();
    this.dom.remove();
    this.observer.destroy();
    if (this.measureScheduled > -1)
      this.win.cancelAnimationFrame(this.measureScheduled);
    this.destroyed = true;
  }
  static scrollIntoView(pos, options = {}) {
    return scrollIntoView.of(new ScrollTarget(typeof pos == "number" ? EditorSelection.cursor(pos) : pos, options.y, options.x, options.yMargin, options.xMargin));
  }
  static domEventHandlers(handlers2) {
    return ViewPlugin.define(() => ({}), { eventHandlers: handlers2 });
  }
  static theme(spec, options) {
    let prefix = StyleModule.newName();
    let result = [theme.of(prefix), styleModule.of(buildTheme(`.${prefix}`, spec))];
    if (options && options.dark)
      result.push(darkTheme.of(true));
    return result;
  }
  static baseTheme(spec) {
    return Prec.lowest(styleModule.of(buildTheme("." + baseThemeID, spec, lightDarkIDs)));
  }
  static findFromDOM(dom) {
    var _a;
    let content = dom.querySelector(".cm-content");
    let cView = content && ContentView.get(content) || ContentView.get(dom);
    return ((_a = cView === null || cView === undefined ? undefined : cView.rootView) === null || _a === undefined ? undefined : _a.view) || null;
  }
}
EditorView.styleModule = styleModule;
EditorView.inputHandler = inputHandler;
EditorView.focusChangeEffect = focusChangeEffect;
EditorView.perLineTextDirection = perLineTextDirection;
EditorView.exceptionSink = exceptionSink;
EditorView.updateListener = updateListener;
EditorView.editable = editable;
EditorView.mouseSelectionStyle = mouseSelectionStyle;
EditorView.dragMovesSelection = dragMovesSelection$1;
EditorView.clickAddsSelectionRange = clickAddsSelectionRange;
EditorView.decorations = decorations;
EditorView.atomicRanges = atomicRanges;
EditorView.bidiIsolatedRanges = bidiIsolatedRanges;
EditorView.scrollMargins = scrollMargins;
EditorView.darkTheme = darkTheme;
EditorView.cspNonce = Facet.define({ combine: (values) => values.length ? values[0] : "" });
EditorView.contentAttributes = contentAttributes;
EditorView.editorAttributes = editorAttributes;
EditorView.lineWrapping = EditorView.contentAttributes.of({ class: "cm-lineWrapping" });
EditorView.announce = StateEffect.define();
var MaxBidiLine = 4096;
var BadMeasure = {};

class CachedOrder {
  constructor(from, to, dir, isolates, fresh, order) {
    this.from = from;
    this.to = to;
    this.dir = dir;
    this.isolates = isolates;
    this.fresh = fresh;
    this.order = order;
  }
  static update(cache, changes) {
    if (changes.empty && !cache.some((c) => c.fresh))
      return cache;
    let result = [], lastDir = cache.length ? cache[cache.length - 1].dir : Direction.LTR;
    for (let i = Math.max(0, cache.length - 10);i < cache.length; i++) {
      let entry = cache[i];
      if (entry.dir == lastDir && !changes.touchesRange(entry.from, entry.to))
        result.push(new CachedOrder(changes.mapPos(entry.from, 1), changes.mapPos(entry.to, -1), entry.dir, entry.isolates, false, entry.order));
    }
    return result;
  }
}
var currentPlatform = browser.mac ? "mac" : browser.windows ? "win" : browser.linux ? "linux" : "key";
var handleKeyEvents = Prec.default(EditorView.domEventHandlers({
  keydown(event, view) {
    return runHandlers(getKeymap(view.state), event, view, "editor");
  }
}));
var keymap = Facet.define({ enables: handleKeyEvents });
var Keymaps = new WeakMap;
var storedPrefix = null;
var PrefixTimeout = 4000;

class RectangleMarker {
  constructor(className, left, top2, width, height) {
    this.className = className;
    this.left = left;
    this.top = top2;
    this.width = width;
    this.height = height;
  }
  draw() {
    let elt = document.createElement("div");
    elt.className = this.className;
    this.adjust(elt);
    return elt;
  }
  update(elt, prev) {
    if (prev.className != this.className)
      return false;
    this.adjust(elt);
    return true;
  }
  adjust(elt) {
    elt.style.left = this.left + "px";
    elt.style.top = this.top + "px";
    if (this.width != null)
      elt.style.width = this.width + "px";
    elt.style.height = this.height + "px";
  }
  eq(p) {
    return this.left == p.left && this.top == p.top && this.width == p.width && this.height == p.height && this.className == p.className;
  }
  static forRange(view, className, range) {
    if (range.empty) {
      let pos = view.coordsAtPos(range.head, range.assoc || 1);
      if (!pos)
        return [];
      let base2 = getBase(view);
      return [new RectangleMarker(className, pos.left - base2.left, pos.top - base2.top, null, pos.bottom - pos.top)];
    } else {
      return rectanglesForRange(view, className, range);
    }
  }
}

class LayerView {
  constructor(view, layer2) {
    this.view = view;
    this.layer = layer2;
    this.drawn = [];
    this.scaleX = 1;
    this.scaleY = 1;
    this.measureReq = { read: this.measure.bind(this), write: this.draw.bind(this) };
    this.dom = view.scrollDOM.appendChild(document.createElement("div"));
    this.dom.classList.add("cm-layer");
    if (layer2.above)
      this.dom.classList.add("cm-layer-above");
    if (layer2.class)
      this.dom.classList.add(layer2.class);
    this.scale();
    this.dom.setAttribute("aria-hidden", "true");
    this.setOrder(view.state);
    view.requestMeasure(this.measureReq);
    if (layer2.mount)
      layer2.mount(this.dom, view);
  }
  update(update) {
    if (update.startState.facet(layerOrder) != update.state.facet(layerOrder))
      this.setOrder(update.state);
    if (this.layer.update(update, this.dom) || update.geometryChanged) {
      this.scale();
      update.view.requestMeasure(this.measureReq);
    }
  }
  setOrder(state2) {
    let pos = 0, order = state2.facet(layerOrder);
    while (pos < order.length && order[pos] != this.layer)
      pos++;
    this.dom.style.zIndex = String((this.layer.above ? 150 : -1) - pos);
  }
  measure() {
    return this.layer.markers(this.view);
  }
  scale() {
    let { scaleX, scaleY } = this.view;
    if (scaleX != this.scaleX || scaleY != this.scaleY) {
      this.scaleX = scaleX;
      this.scaleY = scaleY;
      this.dom.style.transform = `scale(${1 / scaleX}, ${1 / scaleY})`;
    }
  }
  draw(markers) {
    if (markers.length != this.drawn.length || markers.some((p, i) => !sameMarker(p, this.drawn[i]))) {
      let old = this.dom.firstChild, oldI = 0;
      for (let marker of markers) {
        if (marker.update && old && marker.constructor && this.drawn[oldI].constructor && marker.update(old, this.drawn[oldI])) {
          old = old.nextSibling;
          oldI++;
        } else {
          this.dom.insertBefore(marker.draw(), old);
        }
      }
      while (old) {
        let next = old.nextSibling;
        old.remove();
        old = next;
      }
      this.drawn = markers;
    }
  }
  destroy() {
    if (this.layer.destroy)
      this.layer.destroy(this.dom, this.view);
    this.dom.remove();
  }
}
var layerOrder = Facet.define();
var CanHidePrimary = !browser.ios;
var selectionConfig = Facet.define({
  combine(configs) {
    return combineConfig(configs, {
      cursorBlinkRate: 1200,
      drawRangeCursor: true
    }, {
      cursorBlinkRate: (a, b) => Math.min(a, b),
      drawRangeCursor: (a, b) => a || b
    });
  }
});
var cursorLayer = layer({
  above: true,
  markers(view) {
    let { state: state2 } = view, conf = state2.facet(selectionConfig);
    let cursors = [];
    for (let r of state2.selection.ranges) {
      let prim = r == state2.selection.main;
      if (r.empty ? !prim || CanHidePrimary : conf.drawRangeCursor) {
        let className = prim ? "cm-cursor cm-cursor-primary" : "cm-cursor cm-cursor-secondary";
        let cursor = r.empty ? r : EditorSelection.cursor(r.head, r.head > r.anchor ? -1 : 1);
        for (let piece of RectangleMarker.forRange(view, className, cursor))
          cursors.push(piece);
      }
    }
    return cursors;
  },
  update(update, dom) {
    if (update.transactions.some((tr) => tr.selection))
      dom.style.animationName = dom.style.animationName == "cm-blink" ? "cm-blink2" : "cm-blink";
    let confChange = configChanged(update);
    if (confChange)
      setBlinkRate(update.state, dom);
    return update.docChanged || update.selectionSet || confChange;
  },
  mount(dom, view) {
    setBlinkRate(view.state, dom);
  },
  class: "cm-cursorLayer"
});
var selectionLayer = layer({
  above: false,
  markers(view) {
    return view.state.selection.ranges.map((r) => r.empty ? [] : RectangleMarker.forRange(view, "cm-selectionBackground", r)).reduce((a, b) => a.concat(b));
  },
  update(update, dom) {
    return update.docChanged || update.selectionSet || update.viewportChanged || configChanged(update);
  },
  class: "cm-selectionLayer"
});
var themeSpec = {
  ".cm-line": {
    "& ::selection": { backgroundColor: "transparent !important" },
    "&::selection": { backgroundColor: "transparent !important" }
  }
};
if (CanHidePrimary)
  themeSpec[".cm-line"].caretColor = "transparent !important";
var hideNativeSelection = Prec.highest(EditorView.theme(themeSpec));
var setDropCursorPos = StateEffect.define({
  map(pos, mapping) {
    return pos == null ? null : mapping.mapPos(pos);
  }
});
var dropCursorPos = StateField.define({
  create() {
    return null;
  },
  update(pos, tr) {
    if (pos != null)
      pos = tr.changes.mapPos(pos);
    return tr.effects.reduce((pos2, e) => e.is(setDropCursorPos) ? e.value : pos2, pos);
  }
});
var drawDropCursor = ViewPlugin.fromClass(class {
  constructor(view) {
    this.view = view;
    this.cursor = null;
    this.measureReq = { read: this.readPos.bind(this), write: this.drawCursor.bind(this) };
  }
  update(update) {
    var _a;
    let cursorPos = update.state.field(dropCursorPos);
    if (cursorPos == null) {
      if (this.cursor != null) {
        (_a = this.cursor) === null || _a === undefined || _a.remove();
        this.cursor = null;
      }
    } else {
      if (!this.cursor) {
        this.cursor = this.view.scrollDOM.appendChild(document.createElement("div"));
        this.cursor.className = "cm-dropCursor";
      }
      if (update.startState.field(dropCursorPos) != cursorPos || update.docChanged || update.geometryChanged)
        this.view.requestMeasure(this.measureReq);
    }
  }
  readPos() {
    let { view } = this;
    let pos = view.state.field(dropCursorPos);
    let rect = pos != null && view.coordsAtPos(pos);
    if (!rect)
      return null;
    let outer = view.scrollDOM.getBoundingClientRect();
    return {
      left: rect.left - outer.left + view.scrollDOM.scrollLeft * view.scaleX,
      top: rect.top - outer.top + view.scrollDOM.scrollTop * view.scaleY,
      height: rect.bottom - rect.top
    };
  }
  drawCursor(pos) {
    if (this.cursor) {
      let { scaleX, scaleY } = this.view;
      if (pos) {
        this.cursor.style.left = pos.left / scaleX + "px";
        this.cursor.style.top = pos.top / scaleY + "px";
        this.cursor.style.height = pos.height / scaleY + "px";
      } else {
        this.cursor.style.left = "-100000px";
      }
    }
  }
  destroy() {
    if (this.cursor)
      this.cursor.remove();
  }
  setDropPos(pos) {
    if (this.view.state.field(dropCursorPos) != pos)
      this.view.dispatch({ effects: setDropCursorPos.of(pos) });
  }
}, {
  eventHandlers: {
    dragover(event) {
      this.setDropPos(this.view.posAtCoords({ x: event.clientX, y: event.clientY }));
    },
    dragleave(event) {
      if (event.target == this.view.contentDOM || !this.view.contentDOM.contains(event.relatedTarget))
        this.setDropPos(null);
    },
    dragend() {
      this.setDropPos(null);
    },
    drop() {
      this.setDropPos(null);
    }
  }
});

class MatchDecorator {
  constructor(config) {
    const { regexp, decoration, decorate, boundary, maxLength = 1000 } = config;
    if (!regexp.global)
      throw new RangeError("The regular expression given to MatchDecorator should have its 'g' flag set");
    this.regexp = regexp;
    if (decorate) {
      this.addMatch = (match, view, from, add) => decorate(add, from, from + match[0].length, match, view);
    } else if (typeof decoration == "function") {
      this.addMatch = (match, view, from, add) => {
        let deco = decoration(match, view, from);
        if (deco)
          add(from, from + match[0].length, deco);
      };
    } else if (decoration) {
      this.addMatch = (match, _view, from, add) => add(from, from + match[0].length, decoration);
    } else {
      throw new RangeError("Either 'decorate' or 'decoration' should be provided to MatchDecorator");
    }
    this.boundary = boundary;
    this.maxLength = maxLength;
  }
  createDeco(view) {
    let build = new RangeSetBuilder, add = build.add.bind(build);
    for (let { from, to } of matchRanges(view, this.maxLength))
      iterMatches(view.state.doc, this.regexp, from, to, (from2, m) => this.addMatch(m, view, from2, add));
    return build.finish();
  }
  updateDeco(update, deco) {
    let changeFrom = 1e9, changeTo = -1;
    if (update.docChanged)
      update.changes.iterChanges((_f, _t, from, to) => {
        if (to > update.view.viewport.from && from < update.view.viewport.to) {
          changeFrom = Math.min(from, changeFrom);
          changeTo = Math.max(to, changeTo);
        }
      });
    if (update.viewportChanged || changeTo - changeFrom > 1000)
      return this.createDeco(update.view);
    if (changeTo > -1)
      return this.updateRange(update.view, deco.map(update.changes), changeFrom, changeTo);
    return deco;
  }
  updateRange(view, deco, updateFrom, updateTo) {
    for (let r of view.visibleRanges) {
      let from = Math.max(r.from, updateFrom), to = Math.min(r.to, updateTo);
      if (to > from) {
        let fromLine = view.state.doc.lineAt(from), toLine = fromLine.to < to ? view.state.doc.lineAt(to) : fromLine;
        let start = Math.max(r.from, fromLine.from), end = Math.min(r.to, toLine.to);
        if (this.boundary) {
          for (;from > fromLine.from; from--)
            if (this.boundary.test(fromLine.text[from - 1 - fromLine.from])) {
              start = from;
              break;
            }
          for (;to < toLine.to; to++)
            if (this.boundary.test(toLine.text[to - toLine.from])) {
              end = to;
              break;
            }
        }
        let ranges = [], m;
        let add = (from2, to2, deco2) => ranges.push(deco2.range(from2, to2));
        if (fromLine == toLine) {
          this.regexp.lastIndex = start - fromLine.from;
          while ((m = this.regexp.exec(fromLine.text)) && m.index < end - fromLine.from)
            this.addMatch(m, view, m.index + fromLine.from, add);
        } else {
          iterMatches(view.state.doc, this.regexp, start, end, (from2, m2) => this.addMatch(m2, view, from2, add));
        }
        deco = deco.update({ filterFrom: start, filterTo: end, filter: (from2, to2) => from2 < start || to2 > end, add: ranges });
      }
    }
    return deco;
  }
}
var UnicodeRegexpSupport = /x/.unicode != null ? "gu" : "g";
var Specials = new RegExp(`[\0-
-\x1F\x7F-\x9F\xAD\u061C\u200B\u200E\u200F\u2028\u2029\u202D\u202E\u2066\u2067\u2069\uFEFF\uFFF9-\uFFFC]`, UnicodeRegexpSupport);
var Names = {
  0: "null",
  7: "bell",
  8: "backspace",
  10: "newline",
  11: "vertical tab",
  13: "carriage return",
  27: "escape",
  8203: "zero width space",
  8204: "zero width non-joiner",
  8205: "zero width joiner",
  8206: "left-to-right mark",
  8207: "right-to-left mark",
  8232: "line separator",
  8237: "left-to-right override",
  8238: "right-to-left override",
  8294: "left-to-right isolate",
  8295: "right-to-left isolate",
  8297: "pop directional isolate",
  8233: "paragraph separator",
  65279: "zero width no-break space",
  65532: "object replacement"
};
var _supportsTabSize = null;
var specialCharConfig = Facet.define({
  combine(configs) {
    let config = combineConfig(configs, {
      render: null,
      specialChars: Specials,
      addSpecialChars: null
    });
    if (config.replaceTabs = !supportsTabSize())
      config.specialChars = new RegExp("\t|" + config.specialChars.source, UnicodeRegexpSupport);
    if (config.addSpecialChars)
      config.specialChars = new RegExp(config.specialChars.source + "|" + config.addSpecialChars.source, UnicodeRegexpSupport);
    return config;
  }
});
var _plugin = null;
var DefaultPlaceholder = "\u2022";

class SpecialCharWidget extends WidgetType {
  constructor(options, code) {
    super();
    this.options = options;
    this.code = code;
  }
  eq(other) {
    return other.code == this.code;
  }
  toDOM(view) {
    let ph = placeholder$1(this.code);
    let desc = view.state.phrase("Control character") + " " + (Names[this.code] || "0x" + this.code.toString(16));
    let custom = this.options.render && this.options.render(this.code, desc, ph);
    if (custom)
      return custom;
    let span = document.createElement("span");
    span.textContent = ph;
    span.title = desc;
    span.setAttribute("aria-label", desc);
    span.className = "cm-specialChar";
    return span;
  }
  ignoreEvent() {
    return false;
  }
}

class TabWidget extends WidgetType {
  constructor(width) {
    super();
    this.width = width;
  }
  eq(other) {
    return other.width == this.width;
  }
  toDOM() {
    let span = document.createElement("span");
    span.textContent = "\t";
    span.className = "cm-tab";
    span.style.width = this.width + "px";
    return span;
  }
  ignoreEvent() {
    return false;
  }
}
var lineDeco = Decoration.line({ class: "cm-activeLine" });
var activeLineHighlighter = ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = this.getDeco(view);
  }
  update(update) {
    if (update.docChanged || update.selectionSet)
      this.decorations = this.getDeco(update.view);
  }
  getDeco(view) {
    let lastLineStart = -1, deco = [];
    for (let r of view.state.selection.ranges) {
      let line = view.lineBlockAt(r.head);
      if (line.from > lastLineStart) {
        deco.push(lineDeco.range(line.from));
        lastLineStart = line.from;
      }
    }
    return Decoration.set(deco);
  }
}, {
  decorations: (v) => v.decorations
});
var MaxOff = 2000;
var keys = {
  Alt: [18, (e) => !!e.altKey],
  Control: [17, (e) => !!e.ctrlKey],
  Shift: [16, (e) => !!e.shiftKey],
  Meta: [91, (e) => !!e.metaKey]
};
var showCrosshair = { style: "cursor: crosshair" };
var Outside = "-10000px";

class TooltipViewManager {
  constructor(view, facet, createTooltipView) {
    this.facet = facet;
    this.createTooltipView = createTooltipView;
    this.input = view.state.facet(facet);
    this.tooltips = this.input.filter((t) => t);
    this.tooltipViews = this.tooltips.map(createTooltipView);
  }
  update(update) {
    var _a;
    let input = update.state.facet(this.facet);
    let tooltips = input.filter((x) => x);
    if (input === this.input) {
      for (let t of this.tooltipViews)
        if (t.update)
          t.update(update);
      return false;
    }
    let tooltipViews = [];
    for (let i = 0;i < tooltips.length; i++) {
      let tip = tooltips[i], known = -1;
      if (!tip)
        continue;
      for (let i2 = 0;i2 < this.tooltips.length; i2++) {
        let other = this.tooltips[i2];
        if (other && other.create == tip.create)
          known = i2;
      }
      if (known < 0) {
        tooltipViews[i] = this.createTooltipView(tip);
      } else {
        let tooltipView = tooltipViews[i] = this.tooltipViews[known];
        if (tooltipView.update)
          tooltipView.update(update);
      }
    }
    for (let t of this.tooltipViews)
      if (tooltipViews.indexOf(t) < 0) {
        t.dom.remove();
        (_a = t.destroy) === null || _a === undefined || _a.call(t);
      }
    this.input = input;
    this.tooltips = tooltips;
    this.tooltipViews = tooltipViews;
    return true;
  }
}
var tooltipConfig = Facet.define({
  combine: (values) => {
    var _a, _b, _c;
    return {
      position: browser.ios ? "absolute" : ((_a = values.find((conf) => conf.position)) === null || _a === undefined ? undefined : _a.position) || "fixed",
      parent: ((_b = values.find((conf) => conf.parent)) === null || _b === undefined ? undefined : _b.parent) || null,
      tooltipSpace: ((_c = values.find((conf) => conf.tooltipSpace)) === null || _c === undefined ? undefined : _c.tooltipSpace) || windowSpace
    };
  }
});
var knownHeight = new WeakMap;
var tooltipPlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.view = view;
    this.inView = true;
    this.madeAbsolute = false;
    this.lastTransaction = 0;
    this.measureTimeout = -1;
    let config = view.state.facet(tooltipConfig);
    this.position = config.position;
    this.parent = config.parent;
    this.classes = view.themeClasses;
    this.createContainer();
    this.measureReq = { read: this.readMeasure.bind(this), write: this.writeMeasure.bind(this), key: this };
    this.manager = new TooltipViewManager(view, showTooltip, (t) => this.createTooltip(t));
    this.intersectionObserver = typeof IntersectionObserver == "function" ? new IntersectionObserver((entries) => {
      if (Date.now() > this.lastTransaction - 50 && entries.length > 0 && entries[entries.length - 1].intersectionRatio < 1)
        this.measureSoon();
    }, { threshold: [1] }) : null;
    this.observeIntersection();
    view.win.addEventListener("resize", this.measureSoon = this.measureSoon.bind(this));
    this.maybeMeasure();
  }
  createContainer() {
    if (this.parent) {
      this.container = document.createElement("div");
      this.container.style.position = "relative";
      this.container.className = this.view.themeClasses;
      this.parent.appendChild(this.container);
    } else {
      this.container = this.view.dom;
    }
  }
  observeIntersection() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      for (let tooltip of this.manager.tooltipViews)
        this.intersectionObserver.observe(tooltip.dom);
    }
  }
  measureSoon() {
    if (this.measureTimeout < 0)
      this.measureTimeout = setTimeout(() => {
        this.measureTimeout = -1;
        this.maybeMeasure();
      }, 50);
  }
  update(update) {
    if (update.transactions.length)
      this.lastTransaction = Date.now();
    let updated = this.manager.update(update);
    if (updated)
      this.observeIntersection();
    let shouldMeasure = updated || update.geometryChanged;
    let newConfig = update.state.facet(tooltipConfig);
    if (newConfig.position != this.position && !this.madeAbsolute) {
      this.position = newConfig.position;
      for (let t of this.manager.tooltipViews)
        t.dom.style.position = this.position;
      shouldMeasure = true;
    }
    if (newConfig.parent != this.parent) {
      if (this.parent)
        this.container.remove();
      this.parent = newConfig.parent;
      this.createContainer();
      for (let t of this.manager.tooltipViews)
        this.container.appendChild(t.dom);
      shouldMeasure = true;
    } else if (this.parent && this.view.themeClasses != this.classes) {
      this.classes = this.container.className = this.view.themeClasses;
    }
    if (shouldMeasure)
      this.maybeMeasure();
  }
  createTooltip(tooltip) {
    let tooltipView = tooltip.create(this.view);
    tooltipView.dom.classList.add("cm-tooltip");
    if (tooltip.arrow && !tooltipView.dom.querySelector(".cm-tooltip > .cm-tooltip-arrow")) {
      let arrow = document.createElement("div");
      arrow.className = "cm-tooltip-arrow";
      tooltipView.dom.appendChild(arrow);
    }
    tooltipView.dom.style.position = this.position;
    tooltipView.dom.style.top = Outside;
    this.container.appendChild(tooltipView.dom);
    if (tooltipView.mount)
      tooltipView.mount(this.view);
    return tooltipView;
  }
  destroy() {
    var _a, _b;
    this.view.win.removeEventListener("resize", this.measureSoon);
    for (let tooltipView of this.manager.tooltipViews) {
      tooltipView.dom.remove();
      (_a = tooltipView.destroy) === null || _a === undefined || _a.call(tooltipView);
    }
    (_b = this.intersectionObserver) === null || _b === undefined || _b.disconnect();
    clearTimeout(this.measureTimeout);
  }
  readMeasure() {
    let editor = this.view.dom.getBoundingClientRect();
    let scaleX = 1, scaleY = 1, makeAbsolute = false;
    if (this.position == "fixed") {
      let views = this.manager.tooltipViews;
      makeAbsolute = views.length > 0 && views[0].dom.offsetParent != this.container.ownerDocument.body;
    }
    if (makeAbsolute || this.position == "absolute") {
      if (this.parent) {
        let rect = this.parent.getBoundingClientRect();
        if (rect.width && rect.height) {
          scaleX = rect.width / this.parent.offsetWidth;
          scaleY = rect.height / this.parent.offsetHeight;
        }
      } else {
        ({ scaleX, scaleY } = this.view.viewState);
      }
    }
    return {
      editor,
      parent: this.parent ? this.container.getBoundingClientRect() : editor,
      pos: this.manager.tooltips.map((t, i) => {
        let tv = this.manager.tooltipViews[i];
        return tv.getCoords ? tv.getCoords(t.pos) : this.view.coordsAtPos(t.pos);
      }),
      size: this.manager.tooltipViews.map(({ dom }) => dom.getBoundingClientRect()),
      space: this.view.state.facet(tooltipConfig).tooltipSpace(this.view),
      scaleX,
      scaleY,
      makeAbsolute
    };
  }
  writeMeasure(measured) {
    var _a;
    if (measured.makeAbsolute) {
      this.madeAbsolute = true;
      this.position = "absolute";
      for (let t of this.manager.tooltipViews)
        t.dom.style.position = "absolute";
    }
    let { editor, space, scaleX, scaleY } = measured;
    let others = [];
    for (let i = 0;i < this.manager.tooltips.length; i++) {
      let tooltip = this.manager.tooltips[i], tView = this.manager.tooltipViews[i], { dom } = tView;
      let pos = measured.pos[i], size = measured.size[i];
      if (!pos || pos.bottom <= Math.max(editor.top, space.top) || pos.top >= Math.min(editor.bottom, space.bottom) || pos.right < Math.max(editor.left, space.left) - 0.1 || pos.left > Math.min(editor.right, space.right) + 0.1) {
        dom.style.top = Outside;
        continue;
      }
      let arrow = tooltip.arrow ? tView.dom.querySelector(".cm-tooltip-arrow") : null;
      let arrowHeight = arrow ? 7 : 0;
      let width = size.right - size.left, height = (_a = knownHeight.get(tView)) !== null && _a !== undefined ? _a : size.bottom - size.top;
      let offset = tView.offset || noOffset, ltr = this.view.textDirection == Direction.LTR;
      let left = size.width > space.right - space.left ? ltr ? space.left : space.right - size.width : ltr ? Math.min(pos.left - (arrow ? 14 : 0) + offset.x, space.right - width) : Math.max(space.left, pos.left - width + (arrow ? 14 : 0) - offset.x);
      let above = !!tooltip.above;
      if (!tooltip.strictSide && (above ? pos.top - (size.bottom - size.top) - offset.y < space.top : pos.bottom + (size.bottom - size.top) + offset.y > space.bottom) && above == space.bottom - pos.bottom > pos.top - space.top)
        above = !above;
      let spaceVert = (above ? pos.top - space.top : space.bottom - pos.bottom) - arrowHeight;
      if (spaceVert < height && tView.resize !== false) {
        if (spaceVert < this.view.defaultLineHeight) {
          dom.style.top = Outside;
          continue;
        }
        knownHeight.set(tView, height);
        dom.style.height = (height = spaceVert) / scaleY + "px";
      } else if (dom.style.height) {
        dom.style.height = "";
      }
      let top2 = above ? pos.top - height - arrowHeight - offset.y : pos.bottom + arrowHeight + offset.y;
      let right = left + width;
      if (tView.overlap !== true) {
        for (let r of others)
          if (r.left < right && r.right > left && r.top < top2 + height && r.bottom > top2)
            top2 = above ? r.top - height - 2 - arrowHeight : r.bottom + arrowHeight + 2;
      }
      if (this.position == "absolute") {
        dom.style.top = (top2 - measured.parent.top) / scaleY + "px";
        dom.style.left = (left - measured.parent.left) / scaleX + "px";
      } else {
        dom.style.top = top2 / scaleY + "px";
        dom.style.left = left / scaleX + "px";
      }
      if (arrow) {
        let arrowLeft = pos.left + (ltr ? offset.x : -offset.x) - (left + 14 - 7);
        arrow.style.left = arrowLeft / scaleX + "px";
      }
      if (tView.overlap !== true)
        others.push({ left, top: top2, right, bottom: top2 + height });
      dom.classList.toggle("cm-tooltip-above", above);
      dom.classList.toggle("cm-tooltip-below", !above);
      if (tView.positioned)
        tView.positioned(measured.space);
    }
  }
  maybeMeasure() {
    if (this.manager.tooltips.length) {
      if (this.view.inView)
        this.view.requestMeasure(this.measureReq);
      if (this.inView != this.view.inView) {
        this.inView = this.view.inView;
        if (!this.inView)
          for (let tv of this.manager.tooltipViews)
            tv.dom.style.top = Outside;
      }
    }
  }
}, {
  eventHandlers: {
    scroll() {
      this.maybeMeasure();
    }
  }
});
var baseTheme = EditorView.baseTheme({
  ".cm-tooltip": {
    zIndex: 100,
    boxSizing: "border-box"
  },
  "&light .cm-tooltip": {
    border: "1px solid #bbb",
    backgroundColor: "#f5f5f5"
  },
  "&light .cm-tooltip-section:not(:first-child)": {
    borderTop: "1px solid #bbb"
  },
  "&dark .cm-tooltip": {
    backgroundColor: "#333338",
    color: "white"
  },
  ".cm-tooltip-arrow": {
    height: `${7}px`,
    width: `${7 * 2}px`,
    position: "absolute",
    zIndex: -1,
    overflow: "hidden",
    "&:before, &:after": {
      content: "''",
      position: "absolute",
      width: 0,
      height: 0,
      borderLeft: `${7}px solid transparent`,
      borderRight: `${7}px solid transparent`
    },
    ".cm-tooltip-above &": {
      bottom: `-${7}px`,
      "&:before": {
        borderTop: `${7}px solid #bbb`
      },
      "&:after": {
        borderTop: `${7}px solid #f5f5f5`,
        bottom: "1px"
      }
    },
    ".cm-tooltip-below &": {
      top: `-${7}px`,
      "&:before": {
        borderBottom: `${7}px solid #bbb`
      },
      "&:after": {
        borderBottom: `${7}px solid #f5f5f5`,
        top: "1px"
      }
    }
  },
  "&dark .cm-tooltip .cm-tooltip-arrow": {
    "&:before": {
      borderTopColor: "#333338",
      borderBottomColor: "#333338"
    },
    "&:after": {
      borderTopColor: "transparent",
      borderBottomColor: "transparent"
    }
  }
});
var noOffset = { x: 0, y: 0 };
var showTooltip = Facet.define({
  enables: [tooltipPlugin, baseTheme]
});
var showHoverTooltip = Facet.define();

class HoverTooltipHost {
  static create(view) {
    return new HoverTooltipHost(view);
  }
  constructor(view) {
    this.view = view;
    this.mounted = false;
    this.dom = document.createElement("div");
    this.dom.classList.add("cm-tooltip-hover");
    this.manager = new TooltipViewManager(view, showHoverTooltip, (t) => this.createHostedView(t));
  }
  createHostedView(tooltip) {
    let hostedView = tooltip.create(this.view);
    hostedView.dom.classList.add("cm-tooltip-section");
    this.dom.appendChild(hostedView.dom);
    if (this.mounted && hostedView.mount)
      hostedView.mount(this.view);
    return hostedView;
  }
  mount(view) {
    for (let hostedView of this.manager.tooltipViews) {
      if (hostedView.mount)
        hostedView.mount(view);
    }
    this.mounted = true;
  }
  positioned(space) {
    for (let hostedView of this.manager.tooltipViews) {
      if (hostedView.positioned)
        hostedView.positioned(space);
    }
  }
  update(update) {
    this.manager.update(update);
  }
  destroy() {
    var _a;
    for (let t of this.manager.tooltipViews)
      (_a = t.destroy) === null || _a === undefined || _a.call(t);
  }
}
var showHoverTooltipHost = showTooltip.compute([showHoverTooltip], (state2) => {
  let tooltips = state2.facet(showHoverTooltip).filter((t) => t);
  if (tooltips.length === 0)
    return null;
  return {
    pos: Math.min(...tooltips.map((t) => t.pos)),
    end: Math.max(...tooltips.filter((t) => t.end != null).map((t) => t.end)),
    create: HoverTooltipHost.create,
    above: tooltips[0].above,
    arrow: tooltips.some((t) => t.arrow)
  };
});

class HoverPlugin {
  constructor(view, source, field, setHover, hoverTime) {
    this.view = view;
    this.source = source;
    this.field = field;
    this.setHover = setHover;
    this.hoverTime = hoverTime;
    this.hoverTimeout = -1;
    this.restartTimeout = -1;
    this.pending = null;
    this.lastMove = { x: 0, y: 0, target: view.dom, time: 0 };
    this.checkHover = this.checkHover.bind(this);
    view.dom.addEventListener("mouseleave", this.mouseleave = this.mouseleave.bind(this));
    view.dom.addEventListener("mousemove", this.mousemove = this.mousemove.bind(this));
  }
  update() {
    if (this.pending) {
      this.pending = null;
      clearTimeout(this.restartTimeout);
      this.restartTimeout = setTimeout(() => this.startHover(), 20);
    }
  }
  get active() {
    return this.view.state.field(this.field);
  }
  checkHover() {
    this.hoverTimeout = -1;
    if (this.active)
      return;
    let hovered = Date.now() - this.lastMove.time;
    if (hovered < this.hoverTime)
      this.hoverTimeout = setTimeout(this.checkHover, this.hoverTime - hovered);
    else
      this.startHover();
  }
  startHover() {
    clearTimeout(this.restartTimeout);
    let { view, lastMove } = this;
    let desc = view.docView.nearest(lastMove.target);
    if (!desc)
      return;
    let pos, side = 1;
    if (desc instanceof WidgetView) {
      pos = desc.posAtStart;
    } else {
      pos = view.posAtCoords(lastMove);
      if (pos == null)
        return;
      let posCoords = view.coordsAtPos(pos);
      if (!posCoords || lastMove.y < posCoords.top || lastMove.y > posCoords.bottom || lastMove.x < posCoords.left - view.defaultCharacterWidth || lastMove.x > posCoords.right + view.defaultCharacterWidth)
        return;
      let bidi = view.bidiSpans(view.state.doc.lineAt(pos)).find((s) => s.from <= pos && s.to >= pos);
      let rtl = bidi && bidi.dir == Direction.RTL ? -1 : 1;
      side = lastMove.x < posCoords.left ? -rtl : rtl;
    }
    let open = this.source(view, pos, side);
    if (open === null || open === undefined ? undefined : open.then) {
      let pending = this.pending = { pos };
      open.then((result) => {
        if (this.pending == pending) {
          this.pending = null;
          if (result)
            view.dispatch({ effects: this.setHover.of(result) });
        }
      }, (e) => logException(view.state, e, "hover tooltip"));
    } else if (open) {
      view.dispatch({ effects: this.setHover.of(open) });
    }
  }
  mousemove(event) {
    var _a;
    this.lastMove = { x: event.clientX, y: event.clientY, target: event.target, time: Date.now() };
    if (this.hoverTimeout < 0)
      this.hoverTimeout = setTimeout(this.checkHover, this.hoverTime);
    let tooltip = this.active;
    if (tooltip && !isInTooltip(this.lastMove.target) || this.pending) {
      let { pos } = tooltip || this.pending, end = (_a = tooltip === null || tooltip === undefined ? undefined : tooltip.end) !== null && _a !== undefined ? _a : pos;
      if (pos == end ? this.view.posAtCoords(this.lastMove) != pos : !isOverRange(this.view, pos, end, event.clientX, event.clientY)) {
        this.view.dispatch({ effects: this.setHover.of(null) });
        this.pending = null;
      }
    }
  }
  mouseleave(e) {
    clearTimeout(this.hoverTimeout);
    this.hoverTimeout = -1;
    if (this.active && !isInTooltip(e.relatedTarget))
      this.view.dispatch({ effects: this.setHover.of(null) });
  }
  destroy() {
    clearTimeout(this.hoverTimeout);
    this.view.dom.removeEventListener("mouseleave", this.mouseleave);
    this.view.dom.removeEventListener("mousemove", this.mousemove);
  }
}
var closeHoverTooltipEffect = StateEffect.define();
var panelConfig = Facet.define({
  combine(configs) {
    let topContainer, bottomContainer;
    for (let c of configs) {
      topContainer = topContainer || c.topContainer;
      bottomContainer = bottomContainer || c.bottomContainer;
    }
    return { topContainer, bottomContainer };
  }
});
var panelPlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.input = view.state.facet(showPanel);
    this.specs = this.input.filter((s) => s);
    this.panels = this.specs.map((spec) => spec(view));
    let conf = view.state.facet(panelConfig);
    this.top = new PanelGroup(view, true, conf.topContainer);
    this.bottom = new PanelGroup(view, false, conf.bottomContainer);
    this.top.sync(this.panels.filter((p) => p.top));
    this.bottom.sync(this.panels.filter((p) => !p.top));
    for (let p of this.panels) {
      p.dom.classList.add("cm-panel");
      if (p.mount)
        p.mount();
    }
  }
  update(update) {
    let conf = update.state.facet(panelConfig);
    if (this.top.container != conf.topContainer) {
      this.top.sync([]);
      this.top = new PanelGroup(update.view, true, conf.topContainer);
    }
    if (this.bottom.container != conf.bottomContainer) {
      this.bottom.sync([]);
      this.bottom = new PanelGroup(update.view, false, conf.bottomContainer);
    }
    this.top.syncClasses();
    this.bottom.syncClasses();
    let input = update.state.facet(showPanel);
    if (input != this.input) {
      let specs = input.filter((x) => x);
      let panels = [], top2 = [], bottom = [], mount = [];
      for (let spec of specs) {
        let known = this.specs.indexOf(spec), panel;
        if (known < 0) {
          panel = spec(update.view);
          mount.push(panel);
        } else {
          panel = this.panels[known];
          if (panel.update)
            panel.update(update);
        }
        panels.push(panel);
        (panel.top ? top2 : bottom).push(panel);
      }
      this.specs = specs;
      this.panels = panels;
      this.top.sync(top2);
      this.bottom.sync(bottom);
      for (let p of mount) {
        p.dom.classList.add("cm-panel");
        if (p.mount)
          p.mount();
      }
    } else {
      for (let p of this.panels)
        if (p.update)
          p.update(update);
    }
  }
  destroy() {
    this.top.sync([]);
    this.bottom.sync([]);
  }
}, {
  provide: (plugin) => EditorView.scrollMargins.of((view) => {
    let value = view.plugin(plugin);
    return value && { top: value.top.scrollMargin(), bottom: value.bottom.scrollMargin() };
  })
});

class PanelGroup {
  constructor(view, top2, container) {
    this.view = view;
    this.top = top2;
    this.container = container;
    this.dom = undefined;
    this.classes = "";
    this.panels = [];
    this.syncClasses();
  }
  sync(panels) {
    for (let p of this.panels)
      if (p.destroy && panels.indexOf(p) < 0)
        p.destroy();
    this.panels = panels;
    this.syncDOM();
  }
  syncDOM() {
    if (this.panels.length == 0) {
      if (this.dom) {
        this.dom.remove();
        this.dom = undefined;
      }
      return;
    }
    if (!this.dom) {
      this.dom = document.createElement("div");
      this.dom.className = this.top ? "cm-panels cm-panels-top" : "cm-panels cm-panels-bottom";
      this.dom.style[this.top ? "top" : "bottom"] = "0";
      let parent = this.container || this.view.dom;
      parent.insertBefore(this.dom, this.top ? parent.firstChild : null);
    }
    let curDOM = this.dom.firstChild;
    for (let panel of this.panels) {
      if (panel.dom.parentNode == this.dom) {
        while (curDOM != panel.dom)
          curDOM = rm(curDOM);
        curDOM = curDOM.nextSibling;
      } else {
        this.dom.insertBefore(panel.dom, curDOM);
      }
    }
    while (curDOM)
      curDOM = rm(curDOM);
  }
  scrollMargin() {
    return !this.dom || this.container ? 0 : Math.max(0, this.top ? this.dom.getBoundingClientRect().bottom - Math.max(0, this.view.scrollDOM.getBoundingClientRect().top) : Math.min(innerHeight, this.view.scrollDOM.getBoundingClientRect().bottom) - this.dom.getBoundingClientRect().top);
  }
  syncClasses() {
    if (!this.container || this.classes == this.view.themeClasses)
      return;
    for (let cls of this.classes.split(" "))
      if (cls)
        this.container.classList.remove(cls);
    for (let cls of (this.classes = this.view.themeClasses).split(" "))
      if (cls)
        this.container.classList.add(cls);
  }
}
var showPanel = Facet.define({
  enables: panelPlugin
});

class GutterMarker extends RangeValue {
  compare(other) {
    return this == other || this.constructor == other.constructor && this.eq(other);
  }
  eq(other) {
    return false;
  }
  destroy(dom) {
  }
}
GutterMarker.prototype.elementClass = "";
GutterMarker.prototype.toDOM = undefined;
GutterMarker.prototype.mapMode = MapMode.TrackBefore;
GutterMarker.prototype.startSide = GutterMarker.prototype.endSide = -1;
GutterMarker.prototype.point = true;
var gutterLineClass = Facet.define();
var defaults = {
  class: "",
  renderEmptyElements: false,
  elementStyle: "",
  markers: () => RangeSet.empty,
  lineMarker: () => null,
  widgetMarker: () => null,
  lineMarkerChange: null,
  initialSpacer: null,
  updateSpacer: null,
  domEventHandlers: {}
};
var activeGutters = Facet.define();
var unfixGutters = Facet.define({
  combine: (values) => values.some((x) => x)
});
var gutterView = ViewPlugin.fromClass(class {
  constructor(view) {
    this.view = view;
    this.prevViewport = view.viewport;
    this.dom = document.createElement("div");
    this.dom.className = "cm-gutters";
    this.dom.setAttribute("aria-hidden", "true");
    this.dom.style.minHeight = this.view.contentHeight / this.view.scaleY + "px";
    this.gutters = view.state.facet(activeGutters).map((conf) => new SingleGutterView(view, conf));
    for (let gutter2 of this.gutters)
      this.dom.appendChild(gutter2.dom);
    this.fixed = !view.state.facet(unfixGutters);
    if (this.fixed) {
      this.dom.style.position = "sticky";
    }
    this.syncGutters(false);
    view.scrollDOM.insertBefore(this.dom, view.contentDOM);
  }
  update(update) {
    if (this.updateGutters(update)) {
      let vpA = this.prevViewport, vpB = update.view.viewport;
      let vpOverlap = Math.min(vpA.to, vpB.to) - Math.max(vpA.from, vpB.from);
      this.syncGutters(vpOverlap < (vpB.to - vpB.from) * 0.8);
    }
    if (update.geometryChanged)
      this.dom.style.minHeight = this.view.contentHeight + "px";
    if (this.view.state.facet(unfixGutters) != !this.fixed) {
      this.fixed = !this.fixed;
      this.dom.style.position = this.fixed ? "sticky" : "";
    }
    this.prevViewport = update.view.viewport;
  }
  syncGutters(detach) {
    let after = this.dom.nextSibling;
    if (detach)
      this.dom.remove();
    let lineClasses = RangeSet.iter(this.view.state.facet(gutterLineClass), this.view.viewport.from);
    let classSet = [];
    let contexts = this.gutters.map((gutter2) => new UpdateContext(gutter2, this.view.viewport, -this.view.documentPadding.top));
    for (let line of this.view.viewportLineBlocks) {
      if (classSet.length)
        classSet = [];
      if (Array.isArray(line.type)) {
        let first = true;
        for (let b of line.type) {
          if (b.type == BlockType.Text && first) {
            advanceCursor(lineClasses, classSet, b.from);
            for (let cx of contexts)
              cx.line(this.view, b, classSet);
            first = false;
          } else if (b.widget) {
            for (let cx of contexts)
              cx.widget(this.view, b);
          }
        }
      } else if (line.type == BlockType.Text) {
        advanceCursor(lineClasses, classSet, line.from);
        for (let cx of contexts)
          cx.line(this.view, line, classSet);
      } else if (line.widget) {
        for (let cx of contexts)
          cx.widget(this.view, line);
      }
    }
    for (let cx of contexts)
      cx.finish();
    if (detach)
      this.view.scrollDOM.insertBefore(this.dom, after);
  }
  updateGutters(update) {
    let prev = update.startState.facet(activeGutters), cur = update.state.facet(activeGutters);
    let change = update.docChanged || update.heightChanged || update.viewportChanged || !RangeSet.eq(update.startState.facet(gutterLineClass), update.state.facet(gutterLineClass), update.view.viewport.from, update.view.viewport.to);
    if (prev == cur) {
      for (let gutter2 of this.gutters)
        if (gutter2.update(update))
          change = true;
    } else {
      change = true;
      let gutters2 = [];
      for (let conf of cur) {
        let known = prev.indexOf(conf);
        if (known < 0) {
          gutters2.push(new SingleGutterView(this.view, conf));
        } else {
          this.gutters[known].update(update);
          gutters2.push(this.gutters[known]);
        }
      }
      for (let g of this.gutters) {
        g.dom.remove();
        if (gutters2.indexOf(g) < 0)
          g.destroy();
      }
      for (let g of gutters2)
        this.dom.appendChild(g.dom);
      this.gutters = gutters2;
    }
    return change;
  }
  destroy() {
    for (let view of this.gutters)
      view.destroy();
    this.dom.remove();
  }
}, {
  provide: (plugin) => EditorView.scrollMargins.of((view) => {
    let value = view.plugin(plugin);
    if (!value || value.gutters.length == 0 || !value.fixed)
      return null;
    return view.textDirection == Direction.LTR ? { left: value.dom.offsetWidth * view.scaleX } : { right: value.dom.offsetWidth * view.scaleX };
  })
});

class UpdateContext {
  constructor(gutter2, viewport, height) {
    this.gutter = gutter2;
    this.height = height;
    this.i = 0;
    this.cursor = RangeSet.iter(gutter2.markers, viewport.from);
  }
  addElement(view, block, markers) {
    let { gutter: gutter2 } = this, above = block.top - this.height;
    if (this.i == gutter2.elements.length) {
      let newElt = new GutterElement(view, block.height, above, markers);
      gutter2.elements.push(newElt);
      gutter2.dom.appendChild(newElt.dom);
    } else {
      gutter2.elements[this.i].update(view, block.height, above, markers);
    }
    this.height = block.bottom;
    this.i++;
  }
  line(view, line, extraMarkers) {
    let localMarkers = [];
    advanceCursor(this.cursor, localMarkers, line.from);
    if (extraMarkers.length)
      localMarkers = localMarkers.concat(extraMarkers);
    let forLine = this.gutter.config.lineMarker(view, line, localMarkers);
    if (forLine)
      localMarkers.unshift(forLine);
    let gutter2 = this.gutter;
    if (localMarkers.length == 0 && !gutter2.config.renderEmptyElements)
      return;
    this.addElement(view, line, localMarkers);
  }
  widget(view, block) {
    let marker = this.gutter.config.widgetMarker(view, block.widget, block);
    if (marker)
      this.addElement(view, block, [marker]);
  }
  finish() {
    let gutter2 = this.gutter;
    while (gutter2.elements.length > this.i) {
      let last = gutter2.elements.pop();
      gutter2.dom.removeChild(last.dom);
      last.destroy();
    }
  }
}

class SingleGutterView {
  constructor(view, config) {
    this.view = view;
    this.config = config;
    this.elements = [];
    this.spacer = null;
    this.dom = document.createElement("div");
    this.dom.className = "cm-gutter" + (this.config.class ? " " + this.config.class : "");
    for (let prop in config.domEventHandlers) {
      this.dom.addEventListener(prop, (event) => {
        let target = event.target, y;
        if (target != this.dom && this.dom.contains(target)) {
          while (target.parentNode != this.dom)
            target = target.parentNode;
          let rect = target.getBoundingClientRect();
          y = (rect.top + rect.bottom) / 2;
        } else {
          y = event.clientY;
        }
        let line = view.lineBlockAtHeight(y - view.documentTop);
        if (config.domEventHandlers[prop](view, line, event))
          event.preventDefault();
      });
    }
    this.markers = asArray2(config.markers(view));
    if (config.initialSpacer) {
      this.spacer = new GutterElement(view, 0, 0, [config.initialSpacer(view)]);
      this.dom.appendChild(this.spacer.dom);
      this.spacer.dom.style.cssText += "visibility: hidden; pointer-events: none";
    }
  }
  update(update) {
    let prevMarkers = this.markers;
    this.markers = asArray2(this.config.markers(update.view));
    if (this.spacer && this.config.updateSpacer) {
      let updated = this.config.updateSpacer(this.spacer.markers[0], update);
      if (updated != this.spacer.markers[0])
        this.spacer.update(update.view, 0, 0, [updated]);
    }
    let vp = update.view.viewport;
    return !RangeSet.eq(this.markers, prevMarkers, vp.from, vp.to) || (this.config.lineMarkerChange ? this.config.lineMarkerChange(update) : false);
  }
  destroy() {
    for (let elt of this.elements)
      elt.destroy();
  }
}

class GutterElement {
  constructor(view, height, above, markers) {
    this.height = -1;
    this.above = 0;
    this.markers = [];
    this.dom = document.createElement("div");
    this.dom.className = "cm-gutterElement";
    this.update(view, height, above, markers);
  }
  update(view, height, above, markers) {
    if (this.height != height) {
      this.height = height;
      this.dom.style.height = height / view.scaleY + "px";
    }
    if (this.above != above)
      this.dom.style.marginTop = (this.above = above) ? above / view.scaleY + "px" : "";
    if (!sameMarkers(this.markers, markers))
      this.setMarkers(view, markers);
  }
  setMarkers(view, markers) {
    let cls = "cm-gutterElement", domPos = this.dom.firstChild;
    for (let iNew = 0, iOld = 0;; ) {
      let skipTo = iOld, marker = iNew < markers.length ? markers[iNew++] : null, matched = false;
      if (marker) {
        let c = marker.elementClass;
        if (c)
          cls += " " + c;
        for (let i = iOld;i < this.markers.length; i++)
          if (this.markers[i].compare(marker)) {
            skipTo = i;
            matched = true;
            break;
          }
      } else {
        skipTo = this.markers.length;
      }
      while (iOld < skipTo) {
        let next = this.markers[iOld++];
        if (next.toDOM) {
          next.destroy(domPos);
          let after = domPos.nextSibling;
          domPos.remove();
          domPos = after;
        }
      }
      if (!marker)
        break;
      if (marker.toDOM) {
        if (matched)
          domPos = domPos.nextSibling;
        else
          this.dom.insertBefore(marker.toDOM(view), domPos);
      }
      if (matched)
        iOld++;
    }
    this.dom.className = cls;
    this.markers = markers;
  }
  destroy() {
    this.setMarkers(null, []);
  }
}
var lineNumberMarkers = Facet.define();
var lineNumberConfig = Facet.define({
  combine(values) {
    return combineConfig(values, { formatNumber: String, domEventHandlers: {} }, {
      domEventHandlers(a, b) {
        let result = Object.assign({}, a);
        for (let event in b) {
          let exists = result[event], add = b[event];
          result[event] = exists ? (view, line, event2) => exists(view, line, event2) || add(view, line, event2) : add;
        }
        return result;
      }
    });
  }
});

class NumberMarker extends GutterMarker {
  constructor(number) {
    super();
    this.number = number;
  }
  eq(other) {
    return this.number == other.number;
  }
  toDOM() {
    return document.createTextNode(this.number);
  }
}
var lineNumberGutter = activeGutters.compute([lineNumberConfig], (state2) => ({
  class: "cm-lineNumbers",
  renderEmptyElements: false,
  markers(view) {
    return view.state.facet(lineNumberMarkers);
  },
  lineMarker(view, line, others) {
    if (others.some((m) => m.toDOM))
      return null;
    return new NumberMarker(formatNumber(view, view.state.doc.lineAt(line.from).number));
  },
  widgetMarker: () => null,
  lineMarkerChange: (update) => update.startState.facet(lineNumberConfig) != update.state.facet(lineNumberConfig),
  initialSpacer(view) {
    return new NumberMarker(formatNumber(view, maxLineNumber(view.state.doc.lines)));
  },
  updateSpacer(spacer, update) {
    let max = formatNumber(update.view, maxLineNumber(update.view.state.doc.lines));
    return max == spacer.number ? spacer : new NumberMarker(max);
  },
  domEventHandlers: state2.facet(lineNumberConfig).domEventHandlers
}));
var activeLineGutterMarker = new class extends GutterMarker {
  constructor() {
    super(...arguments);
    this.elementClass = "cm-activeLineGutter";
  }
};
var activeLineGutterHighlighter = gutterLineClass.compute(["selection"], (state2) => {
  let marks = [], last = -1;
  for (let range of state2.selection.ranges) {
    let linePos = state2.doc.lineAt(range.head).from;
    if (linePos > last) {
      last = linePos;
      marks.push(activeLineGutterMarker.range(linePos));
    }
  }
  return RangeSet.of(marks);
});

// /home/ray/Code/diagramatics-site/node_modules/@lezer/common/dist/index.js
var checkSide = function(side, pos, from, to) {
  switch (side) {
    case -2:
      return from < pos;
    case -1:
      return to >= pos && from < pos;
    case 0:
      return from < pos && to > pos;
    case 1:
      return from <= pos && to > pos;
    case 2:
      return to > pos;
    case 4:
      return true;
  }
};
var enterUnfinishedNodesBefore = function(node, pos) {
  let scan = node.childBefore(pos);
  while (scan) {
    let last = scan.lastChild;
    if (!last || last.to != scan.to)
      break;
    if (last.type.isError && last.from == last.to) {
      node = scan;
      scan = last.prevSibling;
    } else {
      scan = last;
    }
  }
  return node;
};
var resolveNode = function(node, pos, side, overlays) {
  var _a;
  while (node.from == node.to || (side < 1 ? node.from >= pos : node.from > pos) || (side > -1 ? node.to <= pos : node.to < pos)) {
    let parent = !overlays && node instanceof TreeNode && node.index < 0 ? null : node.parent;
    if (!parent)
      return node;
    node = parent;
  }
  let mode = overlays ? 0 : IterMode.IgnoreOverlays;
  if (overlays)
    for (let scan = node, parent = scan.parent;parent; scan = parent, parent = scan.parent) {
      if (scan instanceof TreeNode && scan.index < 0 && ((_a = parent.enter(pos, side, mode)) === null || _a === undefined ? undefined : _a.from) != scan.from)
        node = parent;
    }
  for (;; ) {
    let inner = node.enter(pos, side, mode);
    if (!inner)
      return node;
    node = inner;
  }
};
var getChildren = function(node, type, before, after) {
  let cur = node.cursor(), result = [];
  if (!cur.firstChild())
    return result;
  if (before != null) {
    while (!cur.type.is(before))
      if (!cur.nextSibling())
        return result;
  }
  for (;; ) {
    if (after != null && cur.type.is(after))
      return result;
    if (cur.type.is(type))
      result.push(cur.node);
    if (!cur.nextSibling())
      return after == null ? result : [];
  }
};
var matchNodeContext = function(node, context, i = context.length - 1) {
  for (let p = node.parent;i >= 0; p = p.parent) {
    if (!p)
      return false;
    if (!p.type.isAnonymous) {
      if (context[i] && context[i] != p.name)
        return false;
      i--;
    }
  }
  return true;
};
var hasChild = function(tree) {
  return tree.children.some((ch) => ch instanceof TreeBuffer || !ch.type.isAnonymous || hasChild(ch));
};
var buildTree = function(data) {
  var _a;
  let { buffer, nodeSet, maxBufferLength = DefaultBufferLength, reused = [], minRepeatType = nodeSet.types.length } = data;
  let cursor = Array.isArray(buffer) ? new FlatBufferCursor(buffer, buffer.length) : buffer;
  let types2 = nodeSet.types;
  let contextHash = 0, lookAhead = 0;
  function takeNode(parentStart, minPos, children2, positions2, inRepeat) {
    let { id, start, end, size } = cursor;
    let lookAheadAtStart = lookAhead;
    while (size < 0) {
      cursor.next();
      if (size == -1) {
        let node2 = reused[id];
        children2.push(node2);
        positions2.push(start - parentStart);
        return;
      } else if (size == -3) {
        contextHash = id;
        return;
      } else if (size == -4) {
        lookAhead = id;
        return;
      } else {
        throw new RangeError(`Unrecognized record size: ${size}`);
      }
    }
    let type = types2[id], node, buffer2;
    let startPos = start - parentStart;
    if (end - start <= maxBufferLength && (buffer2 = findBufferSize(cursor.pos - minPos, inRepeat))) {
      let data2 = new Uint16Array(buffer2.size - buffer2.skip);
      let endPos = cursor.pos - buffer2.size, index = data2.length;
      while (cursor.pos > endPos)
        index = copyToBuffer(buffer2.start, data2, index);
      node = new TreeBuffer(data2, end - buffer2.start, nodeSet);
      startPos = buffer2.start - parentStart;
    } else {
      let endPos = cursor.pos - size;
      cursor.next();
      let localChildren = [], localPositions = [];
      let localInRepeat = id >= minRepeatType ? id : -1;
      let lastGroup = 0, lastEnd = end;
      while (cursor.pos > endPos) {
        if (localInRepeat >= 0 && cursor.id == localInRepeat && cursor.size >= 0) {
          if (cursor.end <= lastEnd - maxBufferLength) {
            makeRepeatLeaf(localChildren, localPositions, start, lastGroup, cursor.end, lastEnd, localInRepeat, lookAheadAtStart);
            lastGroup = localChildren.length;
            lastEnd = cursor.end;
          }
          cursor.next();
        } else {
          takeNode(start, endPos, localChildren, localPositions, localInRepeat);
        }
      }
      if (localInRepeat >= 0 && lastGroup > 0 && lastGroup < localChildren.length)
        makeRepeatLeaf(localChildren, localPositions, start, lastGroup, start, lastEnd, localInRepeat, lookAheadAtStart);
      localChildren.reverse();
      localPositions.reverse();
      if (localInRepeat > -1 && lastGroup > 0) {
        let make = makeBalanced(type);
        node = balanceRange(type, localChildren, localPositions, 0, localChildren.length, 0, end - start, make, make);
      } else {
        node = makeTree(type, localChildren, localPositions, end - start, lookAheadAtStart - end);
      }
    }
    children2.push(node);
    positions2.push(startPos);
  }
  function makeBalanced(type) {
    return (children2, positions2, length2) => {
      let lookAhead2 = 0, lastI = children2.length - 1, last, lookAheadProp;
      if (lastI >= 0 && (last = children2[lastI]) instanceof Tree) {
        if (!lastI && last.type == type && last.length == length2)
          return last;
        if (lookAheadProp = last.prop(NodeProp.lookAhead))
          lookAhead2 = positions2[lastI] + last.length + lookAheadProp;
      }
      return makeTree(type, children2, positions2, length2, lookAhead2);
    };
  }
  function makeRepeatLeaf(children2, positions2, base2, i, from, to, type, lookAhead2) {
    let localChildren = [], localPositions = [];
    while (children2.length > i) {
      localChildren.push(children2.pop());
      localPositions.push(positions2.pop() + base2 - from);
    }
    children2.push(makeTree(nodeSet.types[type], localChildren, localPositions, to - from, lookAhead2 - to));
    positions2.push(from - base2);
  }
  function makeTree(type, children2, positions2, length2, lookAhead2 = 0, props) {
    if (contextHash) {
      let pair = [NodeProp.contextHash, contextHash];
      props = props ? [pair].concat(props) : [pair];
    }
    if (lookAhead2 > 25) {
      let pair = [NodeProp.lookAhead, lookAhead2];
      props = props ? [pair].concat(props) : [pair];
    }
    return new Tree(type, children2, positions2, length2, props);
  }
  function findBufferSize(maxSize, inRepeat) {
    let fork = cursor.fork();
    let size = 0, start = 0, skip = 0, minStart = fork.end - maxBufferLength;
    let result = { size: 0, start: 0, skip: 0 };
    scan:
      for (let minPos = fork.pos - maxSize;fork.pos > minPos; ) {
        let nodeSize = fork.size;
        if (fork.id == inRepeat && nodeSize >= 0) {
          result.size = size;
          result.start = start;
          result.skip = skip;
          skip += 4;
          size += 4;
          fork.next();
          continue;
        }
        let startPos = fork.pos - nodeSize;
        if (nodeSize < 0 || startPos < minPos || fork.start < minStart)
          break;
        let localSkipped = fork.id >= minRepeatType ? 4 : 0;
        let nodeStart = fork.start;
        fork.next();
        while (fork.pos > startPos) {
          if (fork.size < 0) {
            if (fork.size == -3)
              localSkipped += 4;
            else
              break scan;
          } else if (fork.id >= minRepeatType) {
            localSkipped += 4;
          }
          fork.next();
        }
        start = nodeStart;
        size += nodeSize;
        skip += localSkipped;
      }
    if (inRepeat < 0 || size == maxSize) {
      result.size = size;
      result.start = start;
      result.skip = skip;
    }
    return result.size > 4 ? result : undefined;
  }
  function copyToBuffer(bufferStart, buffer2, index) {
    let { id, start, end, size } = cursor;
    cursor.next();
    if (size >= 0 && id < minRepeatType) {
      let startIndex = index;
      if (size > 4) {
        let endPos = cursor.pos - (size - 4);
        while (cursor.pos > endPos)
          index = copyToBuffer(bufferStart, buffer2, index);
      }
      buffer2[--index] = startIndex;
      buffer2[--index] = end - bufferStart;
      buffer2[--index] = start - bufferStart;
      buffer2[--index] = id;
    } else if (size == -3) {
      contextHash = id;
    } else if (size == -4) {
      lookAhead = id;
    }
    return index;
  }
  let children = [], positions = [];
  while (cursor.pos > 0)
    takeNode(data.start || 0, data.bufferStart || 0, children, positions, -1);
  let length = (_a = data.length) !== null && _a !== undefined ? _a : children.length ? positions[0] + children[0].length : 0;
  return new Tree(types2[data.topID], children.reverse(), positions.reverse(), length);
};
var nodeSize = function(balanceType, node) {
  if (!balanceType.isAnonymous || node instanceof TreeBuffer || node.type != balanceType)
    return 1;
  let size = nodeSizeCache.get(node);
  if (size == null) {
    size = 1;
    for (let child of node.children) {
      if (child.type != balanceType || !(child instanceof Tree)) {
        size = 1;
        break;
      }
      size += nodeSize(balanceType, child);
    }
    nodeSizeCache.set(node, size);
  }
  return size;
};
var balanceRange = function(balanceType, children, positions, from, to, start, length, mkTop, mkTree) {
  let total = 0;
  for (let i = from;i < to; i++)
    total += nodeSize(balanceType, children[i]);
  let maxChild = Math.ceil(total * 1.5 / 8);
  let localChildren = [], localPositions = [];
  function divide(children2, positions2, from2, to2, offset) {
    for (let i = from2;i < to2; ) {
      let groupFrom = i, groupStart = positions2[i], groupSize = nodeSize(balanceType, children2[i]);
      i++;
      for (;i < to2; i++) {
        let nextSize = nodeSize(balanceType, children2[i]);
        if (groupSize + nextSize >= maxChild)
          break;
        groupSize += nextSize;
      }
      if (i == groupFrom + 1) {
        if (groupSize > maxChild) {
          let only = children2[groupFrom];
          divide(only.children, only.positions, 0, only.children.length, positions2[groupFrom] + offset);
          continue;
        }
        localChildren.push(children2[groupFrom]);
      } else {
        let length2 = positions2[i - 1] + children2[i - 1].length - groupStart;
        localChildren.push(balanceRange(balanceType, children2, positions2, groupFrom, i, groupStart, length2, null, mkTree));
      }
      localPositions.push(groupStart + offset - start);
    }
  }
  divide(children, positions, from, to, 0);
  return (mkTop || mkTree)(localChildren, localPositions, length);
};
var DefaultBufferLength = 1024;
var nextPropID = 0;

class Range2 {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }
}

class NodeProp {
  constructor(config = {}) {
    this.id = nextPropID++;
    this.perNode = !!config.perNode;
    this.deserialize = config.deserialize || (() => {
      throw new Error("This node type doesn't define a deserialize function");
    });
  }
  add(match) {
    if (this.perNode)
      throw new RangeError("Can't add per-node props to node types");
    if (typeof match != "function")
      match = NodeType.match(match);
    return (type) => {
      let result = match(type);
      return result === undefined ? null : [this, result];
    };
  }
}
NodeProp.closedBy = new NodeProp({ deserialize: (str) => str.split(" ") });
NodeProp.openedBy = new NodeProp({ deserialize: (str) => str.split(" ") });
NodeProp.group = new NodeProp({ deserialize: (str) => str.split(" ") });
NodeProp.contextHash = new NodeProp({ perNode: true });
NodeProp.lookAhead = new NodeProp({ perNode: true });
NodeProp.mounted = new NodeProp({ perNode: true });
var noProps = Object.create(null);

class NodeType {
  constructor(name, props, id, flags = 0) {
    this.name = name;
    this.props = props;
    this.id = id;
    this.flags = flags;
  }
  static define(spec) {
    let props = spec.props && spec.props.length ? Object.create(null) : noProps;
    let flags = (spec.top ? 1 : 0) | (spec.skipped ? 2 : 0) | (spec.error ? 4 : 0) | (spec.name == null ? 8 : 0);
    let type = new NodeType(spec.name || "", props, spec.id, flags);
    if (spec.props)
      for (let src of spec.props) {
        if (!Array.isArray(src))
          src = src(type);
        if (src) {
          if (src[0].perNode)
            throw new RangeError("Can't store a per-node prop on a node type");
          props[src[0].id] = src[1];
        }
      }
    return type;
  }
  prop(prop) {
    return this.props[prop.id];
  }
  get isTop() {
    return (this.flags & 1) > 0;
  }
  get isSkipped() {
    return (this.flags & 2) > 0;
  }
  get isError() {
    return (this.flags & 4) > 0;
  }
  get isAnonymous() {
    return (this.flags & 8) > 0;
  }
  is(name) {
    if (typeof name == "string") {
      if (this.name == name)
        return true;
      let group = this.prop(NodeProp.group);
      return group ? group.indexOf(name) > -1 : false;
    }
    return this.id == name;
  }
  static match(map) {
    let direct = Object.create(null);
    for (let prop in map)
      for (let name of prop.split(" "))
        direct[name] = map[prop];
    return (node) => {
      for (let groups = node.prop(NodeProp.group), i = -1;i < (groups ? groups.length : 0); i++) {
        let found = direct[i < 0 ? node.name : groups[i]];
        if (found)
          return found;
      }
    };
  }
}
NodeType.none = new NodeType("", Object.create(null), 0, 8);

class NodeSet {
  constructor(types2) {
    this.types = types2;
    for (let i = 0;i < types2.length; i++)
      if (types2[i].id != i)
        throw new RangeError("Node type ids should correspond to array positions when creating a node set");
  }
  extend(...props) {
    let newTypes = [];
    for (let type of this.types) {
      let newProps = null;
      for (let source of props) {
        let add = source(type);
        if (add) {
          if (!newProps)
            newProps = Object.assign({}, type.props);
          newProps[add[0].id] = add[1];
        }
      }
      newTypes.push(newProps ? new NodeType(type.name, newProps, type.id, type.flags) : type);
    }
    return new NodeSet(newTypes);
  }
}
var CachedNode = new WeakMap;
var CachedInnerNode = new WeakMap;
var IterMode;
(function(IterMode2) {
  IterMode2[IterMode2["ExcludeBuffers"] = 1] = "ExcludeBuffers";
  IterMode2[IterMode2["IncludeAnonymous"] = 2] = "IncludeAnonymous";
  IterMode2[IterMode2["IgnoreMounts"] = 4] = "IgnoreMounts";
  IterMode2[IterMode2["IgnoreOverlays"] = 8] = "IgnoreOverlays";
})(IterMode || (IterMode = {}));

class Tree {
  constructor(type, children, positions, length, props) {
    this.type = type;
    this.children = children;
    this.positions = positions;
    this.length = length;
    this.props = null;
    if (props && props.length) {
      this.props = Object.create(null);
      for (let [prop, value] of props)
        this.props[typeof prop == "number" ? prop : prop.id] = value;
    }
  }
  toString() {
    let mounted = this.prop(NodeProp.mounted);
    if (mounted && !mounted.overlay)
      return mounted.tree.toString();
    let children = "";
    for (let ch of this.children) {
      let str = ch.toString();
      if (str) {
        if (children)
          children += ",";
        children += str;
      }
    }
    return !this.type.name ? children : (/\W/.test(this.type.name) && !this.type.isError ? JSON.stringify(this.type.name) : this.type.name) + (children.length ? "(" + children + ")" : "");
  }
  cursor(mode = 0) {
    return new TreeCursor(this.topNode, mode);
  }
  cursorAt(pos, side = 0, mode = 0) {
    let scope = CachedNode.get(this) || this.topNode;
    let cursor = new TreeCursor(scope);
    cursor.moveTo(pos, side);
    CachedNode.set(this, cursor._tree);
    return cursor;
  }
  get topNode() {
    return new TreeNode(this, 0, 0, null);
  }
  resolve(pos, side = 0) {
    let node = resolveNode(CachedNode.get(this) || this.topNode, pos, side, false);
    CachedNode.set(this, node);
    return node;
  }
  resolveInner(pos, side = 0) {
    let node = resolveNode(CachedInnerNode.get(this) || this.topNode, pos, side, true);
    CachedInnerNode.set(this, node);
    return node;
  }
  iterate(spec) {
    let { enter, leave, from = 0, to = this.length } = spec;
    let mode = spec.mode || 0, anon = (mode & IterMode.IncludeAnonymous) > 0;
    for (let c = this.cursor(mode | IterMode.IncludeAnonymous);; ) {
      let entered = false;
      if (c.from <= to && c.to >= from && (!anon && c.type.isAnonymous || enter(c) !== false)) {
        if (c.firstChild())
          continue;
        entered = true;
      }
      for (;; ) {
        if (entered && leave && (anon || !c.type.isAnonymous))
          leave(c);
        if (c.nextSibling())
          break;
        if (!c.parent())
          return;
        entered = true;
      }
    }
  }
  prop(prop) {
    return !prop.perNode ? this.type.prop(prop) : this.props ? this.props[prop.id] : undefined;
  }
  get propValues() {
    let result = [];
    if (this.props)
      for (let id in this.props)
        result.push([+id, this.props[id]]);
    return result;
  }
  balance(config = {}) {
    return this.children.length <= 8 ? this : balanceRange(NodeType.none, this.children, this.positions, 0, this.children.length, 0, this.length, (children, positions, length) => new Tree(this.type, children, positions, length, this.propValues), config.makeTree || ((children, positions, length) => new Tree(NodeType.none, children, positions, length)));
  }
  static build(data) {
    return buildTree(data);
  }
}
Tree.empty = new Tree(NodeType.none, [], [], 0);

class FlatBufferCursor {
  constructor(buffer, index) {
    this.buffer = buffer;
    this.index = index;
  }
  get id() {
    return this.buffer[this.index - 4];
  }
  get start() {
    return this.buffer[this.index - 3];
  }
  get end() {
    return this.buffer[this.index - 2];
  }
  get size() {
    return this.buffer[this.index - 1];
  }
  get pos() {
    return this.index;
  }
  next() {
    this.index -= 4;
  }
  fork() {
    return new FlatBufferCursor(this.buffer, this.index);
  }
}

class TreeBuffer {
  constructor(buffer, length, set) {
    this.buffer = buffer;
    this.length = length;
    this.set = set;
  }
  get type() {
    return NodeType.none;
  }
  toString() {
    let result = [];
    for (let index = 0;index < this.buffer.length; ) {
      result.push(this.childString(index));
      index = this.buffer[index + 3];
    }
    return result.join(",");
  }
  childString(index) {
    let id = this.buffer[index], endIndex = this.buffer[index + 3];
    let type = this.set.types[id], result = type.name;
    if (/\W/.test(result) && !type.isError)
      result = JSON.stringify(result);
    index += 4;
    if (endIndex == index)
      return result;
    let children = [];
    while (index < endIndex) {
      children.push(this.childString(index));
      index = this.buffer[index + 3];
    }
    return result + "(" + children.join(",") + ")";
  }
  findChild(startIndex, endIndex, dir, pos, side) {
    let { buffer } = this, pick = -1;
    for (let i = startIndex;i != endIndex; i = buffer[i + 3]) {
      if (checkSide(side, pos, buffer[i + 1], buffer[i + 2])) {
        pick = i;
        if (dir > 0)
          break;
      }
    }
    return pick;
  }
  slice(startI, endI, from) {
    let b = this.buffer;
    let copy = new Uint16Array(endI - startI), len = 0;
    for (let i = startI, j = 0;i < endI; ) {
      copy[j++] = b[i++];
      copy[j++] = b[i++] - from;
      let to = copy[j++] = b[i++] - from;
      copy[j++] = b[i++] - startI;
      len = Math.max(len, to);
    }
    return new TreeBuffer(copy, len, this.set);
  }
}

class TreeNode {
  constructor(_tree, from, index, _parent) {
    this._tree = _tree;
    this.from = from;
    this.index = index;
    this._parent = _parent;
  }
  get type() {
    return this._tree.type;
  }
  get name() {
    return this._tree.type.name;
  }
  get to() {
    return this.from + this._tree.length;
  }
  nextChild(i, dir, pos, side, mode = 0) {
    for (let parent = this;; ) {
      for (let { children, positions } = parent._tree, e = dir > 0 ? children.length : -1;i != e; i += dir) {
        let next = children[i], start = positions[i] + parent.from;
        if (!checkSide(side, pos, start, start + next.length))
          continue;
        if (next instanceof TreeBuffer) {
          if (mode & IterMode.ExcludeBuffers)
            continue;
          let index = next.findChild(0, next.buffer.length, dir, pos - start, side);
          if (index > -1)
            return new BufferNode(new BufferContext(parent, next, i, start), null, index);
        } else if (mode & IterMode.IncludeAnonymous || (!next.type.isAnonymous || hasChild(next))) {
          let mounted;
          if (!(mode & IterMode.IgnoreMounts) && next.props && (mounted = next.prop(NodeProp.mounted)) && !mounted.overlay)
            return new TreeNode(mounted.tree, start, i, parent);
          let inner = new TreeNode(next, start, i, parent);
          return mode & IterMode.IncludeAnonymous || !inner.type.isAnonymous ? inner : inner.nextChild(dir < 0 ? next.children.length - 1 : 0, dir, pos, side);
        }
      }
      if (mode & IterMode.IncludeAnonymous || !parent.type.isAnonymous)
        return null;
      if (parent.index >= 0)
        i = parent.index + dir;
      else
        i = dir < 0 ? -1 : parent._parent._tree.children.length;
      parent = parent._parent;
      if (!parent)
        return null;
    }
  }
  get firstChild() {
    return this.nextChild(0, 1, 0, 4);
  }
  get lastChild() {
    return this.nextChild(this._tree.children.length - 1, -1, 0, 4);
  }
  childAfter(pos) {
    return this.nextChild(0, 1, pos, 2);
  }
  childBefore(pos) {
    return this.nextChild(this._tree.children.length - 1, -1, pos, -2);
  }
  enter(pos, side, mode = 0) {
    let mounted;
    if (!(mode & IterMode.IgnoreOverlays) && (mounted = this._tree.prop(NodeProp.mounted)) && mounted.overlay) {
      let rPos = pos - this.from;
      for (let { from, to } of mounted.overlay) {
        if ((side > 0 ? from <= rPos : from < rPos) && (side < 0 ? to >= rPos : to > rPos))
          return new TreeNode(mounted.tree, mounted.overlay[0].from + this.from, -1, this);
      }
    }
    return this.nextChild(0, 1, pos, side, mode);
  }
  nextSignificantParent() {
    let val = this;
    while (val.type.isAnonymous && val._parent)
      val = val._parent;
    return val;
  }
  get parent() {
    return this._parent ? this._parent.nextSignificantParent() : null;
  }
  get nextSibling() {
    return this._parent && this.index >= 0 ? this._parent.nextChild(this.index + 1, 1, 0, 4) : null;
  }
  get prevSibling() {
    return this._parent && this.index >= 0 ? this._parent.nextChild(this.index - 1, -1, 0, 4) : null;
  }
  cursor(mode = 0) {
    return new TreeCursor(this, mode);
  }
  get tree() {
    return this._tree;
  }
  toTree() {
    return this._tree;
  }
  resolve(pos, side = 0) {
    return resolveNode(this, pos, side, false);
  }
  resolveInner(pos, side = 0) {
    return resolveNode(this, pos, side, true);
  }
  enterUnfinishedNodesBefore(pos) {
    return enterUnfinishedNodesBefore(this, pos);
  }
  getChild(type, before = null, after = null) {
    let r = getChildren(this, type, before, after);
    return r.length ? r[0] : null;
  }
  getChildren(type, before = null, after = null) {
    return getChildren(this, type, before, after);
  }
  toString() {
    return this._tree.toString();
  }
  get node() {
    return this;
  }
  matchContext(context) {
    return matchNodeContext(this, context);
  }
}

class BufferContext {
  constructor(parent, buffer, index, start) {
    this.parent = parent;
    this.buffer = buffer;
    this.index = index;
    this.start = start;
  }
}

class BufferNode {
  get name() {
    return this.type.name;
  }
  get from() {
    return this.context.start + this.context.buffer.buffer[this.index + 1];
  }
  get to() {
    return this.context.start + this.context.buffer.buffer[this.index + 2];
  }
  constructor(context, _parent, index) {
    this.context = context;
    this._parent = _parent;
    this.index = index;
    this.type = context.buffer.set.types[context.buffer.buffer[index]];
  }
  child(dir, pos, side) {
    let { buffer } = this.context;
    let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], dir, pos - this.context.start, side);
    return index < 0 ? null : new BufferNode(this.context, this, index);
  }
  get firstChild() {
    return this.child(1, 0, 4);
  }
  get lastChild() {
    return this.child(-1, 0, 4);
  }
  childAfter(pos) {
    return this.child(1, pos, 2);
  }
  childBefore(pos) {
    return this.child(-1, pos, -2);
  }
  enter(pos, side, mode = 0) {
    if (mode & IterMode.ExcludeBuffers)
      return null;
    let { buffer } = this.context;
    let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], side > 0 ? 1 : -1, pos - this.context.start, side);
    return index < 0 ? null : new BufferNode(this.context, this, index);
  }
  get parent() {
    return this._parent || this.context.parent.nextSignificantParent();
  }
  externalSibling(dir) {
    return this._parent ? null : this.context.parent.nextChild(this.context.index + dir, dir, 0, 4);
  }
  get nextSibling() {
    let { buffer } = this.context;
    let after = buffer.buffer[this.index + 3];
    if (after < (this._parent ? buffer.buffer[this._parent.index + 3] : buffer.buffer.length))
      return new BufferNode(this.context, this._parent, after);
    return this.externalSibling(1);
  }
  get prevSibling() {
    let { buffer } = this.context;
    let parentStart = this._parent ? this._parent.index + 4 : 0;
    if (this.index == parentStart)
      return this.externalSibling(-1);
    return new BufferNode(this.context, this._parent, buffer.findChild(parentStart, this.index, -1, 0, 4));
  }
  cursor(mode = 0) {
    return new TreeCursor(this, mode);
  }
  get tree() {
    return null;
  }
  toTree() {
    let children = [], positions = [];
    let { buffer } = this.context;
    let startI = this.index + 4, endI = buffer.buffer[this.index + 3];
    if (endI > startI) {
      let from = buffer.buffer[this.index + 1];
      children.push(buffer.slice(startI, endI, from));
      positions.push(0);
    }
    return new Tree(this.type, children, positions, this.to - this.from);
  }
  resolve(pos, side = 0) {
    return resolveNode(this, pos, side, false);
  }
  resolveInner(pos, side = 0) {
    return resolveNode(this, pos, side, true);
  }
  enterUnfinishedNodesBefore(pos) {
    return enterUnfinishedNodesBefore(this, pos);
  }
  toString() {
    return this.context.buffer.childString(this.index);
  }
  getChild(type, before = null, after = null) {
    let r = getChildren(this, type, before, after);
    return r.length ? r[0] : null;
  }
  getChildren(type, before = null, after = null) {
    return getChildren(this, type, before, after);
  }
  get node() {
    return this;
  }
  matchContext(context) {
    return matchNodeContext(this, context);
  }
}

class TreeCursor {
  get name() {
    return this.type.name;
  }
  constructor(node, mode = 0) {
    this.mode = mode;
    this.buffer = null;
    this.stack = [];
    this.index = 0;
    this.bufferNode = null;
    if (node instanceof TreeNode) {
      this.yieldNode(node);
    } else {
      this._tree = node.context.parent;
      this.buffer = node.context;
      for (let n = node._parent;n; n = n._parent)
        this.stack.unshift(n.index);
      this.bufferNode = node;
      this.yieldBuf(node.index);
    }
  }
  yieldNode(node) {
    if (!node)
      return false;
    this._tree = node;
    this.type = node.type;
    this.from = node.from;
    this.to = node.to;
    return true;
  }
  yieldBuf(index, type) {
    this.index = index;
    let { start, buffer } = this.buffer;
    this.type = type || buffer.set.types[buffer.buffer[index]];
    this.from = start + buffer.buffer[index + 1];
    this.to = start + buffer.buffer[index + 2];
    return true;
  }
  yield(node) {
    if (!node)
      return false;
    if (node instanceof TreeNode) {
      this.buffer = null;
      return this.yieldNode(node);
    }
    this.buffer = node.context;
    return this.yieldBuf(node.index, node.type);
  }
  toString() {
    return this.buffer ? this.buffer.buffer.childString(this.index) : this._tree.toString();
  }
  enterChild(dir, pos, side) {
    if (!this.buffer)
      return this.yield(this._tree.nextChild(dir < 0 ? this._tree._tree.children.length - 1 : 0, dir, pos, side, this.mode));
    let { buffer } = this.buffer;
    let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], dir, pos - this.buffer.start, side);
    if (index < 0)
      return false;
    this.stack.push(this.index);
    return this.yieldBuf(index);
  }
  firstChild() {
    return this.enterChild(1, 0, 4);
  }
  lastChild() {
    return this.enterChild(-1, 0, 4);
  }
  childAfter(pos) {
    return this.enterChild(1, pos, 2);
  }
  childBefore(pos) {
    return this.enterChild(-1, pos, -2);
  }
  enter(pos, side, mode = this.mode) {
    if (!this.buffer)
      return this.yield(this._tree.enter(pos, side, mode));
    return mode & IterMode.ExcludeBuffers ? false : this.enterChild(1, pos, side);
  }
  parent() {
    if (!this.buffer)
      return this.yieldNode(this.mode & IterMode.IncludeAnonymous ? this._tree._parent : this._tree.parent);
    if (this.stack.length)
      return this.yieldBuf(this.stack.pop());
    let parent = this.mode & IterMode.IncludeAnonymous ? this.buffer.parent : this.buffer.parent.nextSignificantParent();
    this.buffer = null;
    return this.yieldNode(parent);
  }
  sibling(dir) {
    if (!this.buffer)
      return !this._tree._parent ? false : this.yield(this._tree.index < 0 ? null : this._tree._parent.nextChild(this._tree.index + dir, dir, 0, 4, this.mode));
    let { buffer } = this.buffer, d = this.stack.length - 1;
    if (dir < 0) {
      let parentStart = d < 0 ? 0 : this.stack[d] + 4;
      if (this.index != parentStart)
        return this.yieldBuf(buffer.findChild(parentStart, this.index, -1, 0, 4));
    } else {
      let after = buffer.buffer[this.index + 3];
      if (after < (d < 0 ? buffer.buffer.length : buffer.buffer[this.stack[d] + 3]))
        return this.yieldBuf(after);
    }
    return d < 0 ? this.yield(this.buffer.parent.nextChild(this.buffer.index + dir, dir, 0, 4, this.mode)) : false;
  }
  nextSibling() {
    return this.sibling(1);
  }
  prevSibling() {
    return this.sibling(-1);
  }
  atLastNode(dir) {
    let index, parent, { buffer } = this;
    if (buffer) {
      if (dir > 0) {
        if (this.index < buffer.buffer.buffer.length)
          return false;
      } else {
        for (let i = 0;i < this.index; i++)
          if (buffer.buffer.buffer[i + 3] < this.index)
            return false;
      }
      ({ index, parent } = buffer);
    } else {
      ({ index, _parent: parent } = this._tree);
    }
    for (;parent; { index, _parent: parent } = parent) {
      if (index > -1)
        for (let i = index + dir, e = dir < 0 ? -1 : parent._tree.children.length;i != e; i += dir) {
          let child = parent._tree.children[i];
          if (this.mode & IterMode.IncludeAnonymous || child instanceof TreeBuffer || !child.type.isAnonymous || hasChild(child))
            return false;
        }
    }
    return true;
  }
  move(dir, enter) {
    if (enter && this.enterChild(dir, 0, 4))
      return true;
    for (;; ) {
      if (this.sibling(dir))
        return true;
      if (this.atLastNode(dir) || !this.parent())
        return false;
    }
  }
  next(enter = true) {
    return this.move(1, enter);
  }
  prev(enter = true) {
    return this.move(-1, enter);
  }
  moveTo(pos, side = 0) {
    while (this.from == this.to || (side < 1 ? this.from >= pos : this.from > pos) || (side > -1 ? this.to <= pos : this.to < pos))
      if (!this.parent())
        break;
    while (this.enterChild(1, pos, side)) {
    }
    return this;
  }
  get node() {
    if (!this.buffer)
      return this._tree;
    let cache = this.bufferNode, result = null, depth = 0;
    if (cache && cache.context == this.buffer) {
      scan:
        for (let index = this.index, d = this.stack.length;d >= 0; ) {
          for (let c = cache;c; c = c._parent)
            if (c.index == index) {
              if (index == this.index)
                return c;
              result = c;
              depth = d + 1;
              break scan;
            }
          index = this.stack[--d];
        }
    }
    for (let i = depth;i < this.stack.length; i++)
      result = new BufferNode(this.buffer, result, this.stack[i]);
    return this.bufferNode = new BufferNode(this.buffer, result, this.index);
  }
  get tree() {
    return this.buffer ? null : this._tree._tree;
  }
  iterate(enter, leave) {
    for (let depth = 0;; ) {
      let mustLeave = false;
      if (this.type.isAnonymous || enter(this) !== false) {
        if (this.firstChild()) {
          depth++;
          continue;
        }
        if (!this.type.isAnonymous)
          mustLeave = true;
      }
      for (;; ) {
        if (mustLeave && leave)
          leave(this);
        mustLeave = this.type.isAnonymous;
        if (this.nextSibling())
          break;
        if (!depth)
          return;
        this.parent();
        depth--;
        mustLeave = true;
      }
    }
  }
  matchContext(context) {
    if (!this.buffer)
      return matchNodeContext(this.node, context);
    let { buffer } = this.buffer, { types: types2 } = buffer.set;
    for (let i = context.length - 1, d = this.stack.length - 1;i >= 0; d--) {
      if (d < 0)
        return matchNodeContext(this.node, context, i);
      let type = types2[buffer.buffer[this.stack[d]]];
      if (!type.isAnonymous) {
        if (context[i] && context[i] != type.name)
          return false;
        i--;
      }
    }
    return true;
  }
}
var nodeSizeCache = new WeakMap;

class NodeWeakMap {
  constructor() {
    this.map = new WeakMap;
  }
  setBuffer(buffer, index, value) {
    let inner = this.map.get(buffer);
    if (!inner)
      this.map.set(buffer, inner = new Map);
    inner.set(index, value);
  }
  getBuffer(buffer, index) {
    let inner = this.map.get(buffer);
    return inner && inner.get(index);
  }
  set(node, value) {
    if (node instanceof BufferNode)
      this.setBuffer(node.context.buffer, node.index, value);
    else if (node instanceof TreeNode)
      this.map.set(node.tree, value);
  }
  get(node) {
    return node instanceof BufferNode ? this.getBuffer(node.context.buffer, node.index) : node instanceof TreeNode ? this.map.get(node.tree) : undefined;
  }
  cursorSet(cursor, value) {
    if (cursor.buffer)
      this.setBuffer(cursor.buffer.buffer, cursor.index, value);
    else
      this.map.set(cursor.tree, value);
  }
  cursorGet(cursor) {
    return cursor.buffer ? this.getBuffer(cursor.buffer.buffer, cursor.index) : this.map.get(cursor.tree);
  }
}

class TreeFragment {
  constructor(from, to, tree, offset, openStart = false, openEnd = false) {
    this.from = from;
    this.to = to;
    this.tree = tree;
    this.offset = offset;
    this.open = (openStart ? 1 : 0) | (openEnd ? 2 : 0);
  }
  get openStart() {
    return (this.open & 1) > 0;
  }
  get openEnd() {
    return (this.open & 2) > 0;
  }
  static addTree(tree, fragments = [], partial = false) {
    let result = [new TreeFragment(0, tree.length, tree, 0, false, partial)];
    for (let f of fragments)
      if (f.to > tree.length)
        result.push(f);
    return result;
  }
  static applyChanges(fragments, changes, minGap = 128) {
    if (!changes.length)
      return fragments;
    let result = [];
    let fI = 1, nextF = fragments.length ? fragments[0] : null;
    for (let cI = 0, pos = 0, off = 0;; cI++) {
      let nextC = cI < changes.length ? changes[cI] : null;
      let nextPos = nextC ? nextC.fromA : 1e9;
      if (nextPos - pos >= minGap)
        while (nextF && nextF.from < nextPos) {
          let cut = nextF;
          if (pos >= cut.from || nextPos <= cut.to || off) {
            let fFrom = Math.max(cut.from, pos) - off, fTo = Math.min(cut.to, nextPos) - off;
            cut = fFrom >= fTo ? null : new TreeFragment(fFrom, fTo, cut.tree, cut.offset + off, cI > 0, !!nextC);
          }
          if (cut)
            result.push(cut);
          if (nextF.to > nextPos)
            break;
          nextF = fI < fragments.length ? fragments[fI++] : null;
        }
      if (!nextC)
        break;
      pos = nextC.toA;
      off = nextC.toA - nextC.toB;
    }
    return result;
  }
}

class Parser {
  startParse(input, fragments, ranges) {
    if (typeof input == "string")
      input = new StringInput(input);
    ranges = !ranges ? [new Range2(0, input.length)] : ranges.length ? ranges.map((r) => new Range2(r.from, r.to)) : [new Range2(0, 0)];
    return this.createParse(input, fragments || [], ranges);
  }
  parse(input, fragments, ranges) {
    let parse = this.startParse(input, fragments, ranges);
    for (;; ) {
      let done = parse.advance();
      if (done)
        return done;
    }
  }
}

class StringInput {
  constructor(string) {
    this.string = string;
  }
  get length() {
    return this.string.length;
  }
  chunk(from) {
    return this.string.slice(from);
  }
  get lineChunks() {
    return false;
  }
  read(from, to) {
    return this.string.slice(from, to);
  }
}
var stoppedInner = new NodeProp({ perNode: true });

// /home/ray/Code/diagramatics-site/node_modules/@lezer/highlight/dist/index.js
var sameArray2 = function(a, b) {
  return a.length == b.length && a.every((x, i) => x == b[i]);
};
var powerSet = function(array) {
  let sets = [[]];
  for (let i = 0;i < array.length; i++) {
    for (let j = 0, e = sets.length;j < e; j++) {
      sets.push(sets[j].concat(array[i]));
    }
  }
  return sets.sort((a, b) => b.length - a.length);
};
var styleTags = function(spec) {
  let byName = Object.create(null);
  for (let prop in spec) {
    let tags = spec[prop];
    if (!Array.isArray(tags))
      tags = [tags];
    for (let part of prop.split(" "))
      if (part) {
        let pieces = [], mode = 2, rest = part;
        for (let pos = 0;; ) {
          if (rest == "..." && pos > 0 && pos + 3 == part.length) {
            mode = 1;
            break;
          }
          let m = /^"(?:[^"\\]|\\.)*?"|[^\/!]+/.exec(rest);
          if (!m)
            throw new RangeError("Invalid path: " + part);
          pieces.push(m[0] == "*" ? "" : m[0][0] == '"' ? JSON.parse(m[0]) : m[0]);
          pos += m[0].length;
          if (pos == part.length)
            break;
          let next = part[pos++];
          if (pos == part.length && next == "!") {
            mode = 0;
            break;
          }
          if (next != "/")
            throw new RangeError("Invalid path: " + part);
          rest = part.slice(pos);
        }
        let last = pieces.length - 1, inner = pieces[last];
        if (!inner)
          throw new RangeError("Invalid path: " + part);
        let rule = new Rule(tags, mode, last > 0 ? pieces.slice(0, last) : null);
        byName[inner] = rule.sort(byName[inner]);
      }
  }
  return ruleNodeProp.add(byName);
};
var tagHighlighter = function(tags, options) {
  let map = Object.create(null);
  for (let style of tags) {
    if (!Array.isArray(style.tag))
      map[style.tag.id] = style.class;
    else
      for (let tag of style.tag)
        map[tag.id] = style.class;
  }
  let { scope, all = null } = options || {};
  return {
    style: (tags2) => {
      let cls = all;
      for (let tag of tags2) {
        for (let sub of tag.set) {
          let tagClass = map[sub.id];
          if (tagClass) {
            cls = cls ? cls + " " + tagClass : tagClass;
            break;
          }
        }
      }
      return cls;
    },
    scope
  };
};
var highlightTags = function(highlighters, tags) {
  let result = null;
  for (let highlighter of highlighters) {
    let value = highlighter.style(tags);
    if (value)
      result = result ? result + " " + value : value;
  }
  return result;
};
var highlightTree = function(tree, highlighter, putStyle, from = 0, to = tree.length) {
  let builder = new HighlightBuilder(from, Array.isArray(highlighter) ? highlighter : [highlighter], putStyle);
  builder.highlightRange(tree.cursor(), from, to, "", builder.highlighters);
  builder.flush(to);
};
var getStyleTags = function(node) {
  let rule = node.type.prop(ruleNodeProp);
  while (rule && rule.context && !node.matchContext(rule.context))
    rule = rule.next;
  return rule || null;
};
var nextTagID = 0;

class Tag {
  constructor(set, base2, modified) {
    this.set = set;
    this.base = base2;
    this.modified = modified;
    this.id = nextTagID++;
  }
  static define(parent) {
    if (parent === null || parent === undefined ? undefined : parent.base)
      throw new Error("Can not derive from a modified tag");
    let tag = new Tag([], null, []);
    tag.set.push(tag);
    if (parent)
      for (let t of parent.set)
        tag.set.push(t);
    return tag;
  }
  static defineModifier() {
    let mod = new Modifier;
    return (tag) => {
      if (tag.modified.indexOf(mod) > -1)
        return tag;
      return Modifier.get(tag.base || tag, tag.modified.concat(mod).sort((a, b) => a.id - b.id));
    };
  }
}
var nextModifierID = 0;

class Modifier {
  constructor() {
    this.instances = [];
    this.id = nextModifierID++;
  }
  static get(base2, mods) {
    if (!mods.length)
      return base2;
    let exists = mods[0].instances.find((t) => t.base == base2 && sameArray2(mods, t.modified));
    if (exists)
      return exists;
    let set = [], tag = new Tag(set, base2, mods);
    for (let m of mods)
      m.instances.push(tag);
    let configs = powerSet(mods);
    for (let parent of base2.set)
      if (!parent.modified.length)
        for (let config of configs)
          set.push(Modifier.get(parent, config));
    return tag;
  }
}
var ruleNodeProp = new NodeProp;

class Rule {
  constructor(tags, mode, context, next) {
    this.tags = tags;
    this.mode = mode;
    this.context = context;
    this.next = next;
  }
  get opaque() {
    return this.mode == 0;
  }
  get inherit() {
    return this.mode == 1;
  }
  sort(other) {
    if (!other || other.depth < this.depth) {
      this.next = other;
      return this;
    }
    other.next = this.sort(other.next);
    return other;
  }
  get depth() {
    return this.context ? this.context.length : 0;
  }
}
Rule.empty = new Rule([], 2, null);

class HighlightBuilder {
  constructor(at, highlighters, span) {
    this.at = at;
    this.highlighters = highlighters;
    this.span = span;
    this.class = "";
  }
  startSpan(at, cls) {
    if (cls != this.class) {
      this.flush(at);
      if (at > this.at)
        this.at = at;
      this.class = cls;
    }
  }
  flush(to) {
    if (to > this.at && this.class)
      this.span(this.at, to, this.class);
  }
  highlightRange(cursor, from, to, inheritedClass, highlighters) {
    let { type, from: start, to: end } = cursor;
    if (start >= to || end <= from)
      return;
    if (type.isTop)
      highlighters = this.highlighters.filter((h) => !h.scope || h.scope(type));
    let cls = inheritedClass;
    let rule = getStyleTags(cursor) || Rule.empty;
    let tagCls = highlightTags(highlighters, rule.tags);
    if (tagCls) {
      if (cls)
        cls += " ";
      cls += tagCls;
      if (rule.mode == 1)
        inheritedClass += (inheritedClass ? " " : "") + tagCls;
    }
    this.startSpan(Math.max(from, start), cls);
    if (rule.opaque)
      return;
    let mounted = cursor.tree && cursor.tree.prop(NodeProp.mounted);
    if (mounted && mounted.overlay) {
      let inner = cursor.node.enter(mounted.overlay[0].from + start, 1);
      let innerHighlighters = this.highlighters.filter((h) => !h.scope || h.scope(mounted.tree.type));
      let hasChild2 = cursor.firstChild();
      for (let i = 0, pos = start;; i++) {
        let next = i < mounted.overlay.length ? mounted.overlay[i] : null;
        let nextPos = next ? next.from + start : end;
        let rangeFrom = Math.max(from, pos), rangeTo = Math.min(to, nextPos);
        if (rangeFrom < rangeTo && hasChild2) {
          while (cursor.from < rangeTo) {
            this.highlightRange(cursor, rangeFrom, rangeTo, inheritedClass, highlighters);
            this.startSpan(Math.min(rangeTo, cursor.to), cls);
            if (cursor.to >= nextPos || !cursor.nextSibling())
              break;
          }
        }
        if (!next || nextPos > to)
          break;
        pos = next.to + start;
        if (pos > from) {
          this.highlightRange(inner.cursor(), Math.max(from, next.from + start), Math.min(to, pos), "", innerHighlighters);
          this.startSpan(Math.min(to, pos), cls);
        }
      }
      if (hasChild2)
        cursor.parent();
    } else if (cursor.firstChild()) {
      if (mounted)
        inheritedClass = "";
      do {
        if (cursor.to <= from)
          continue;
        if (cursor.from >= to)
          break;
        this.highlightRange(cursor, from, to, inheritedClass, highlighters);
        this.startSpan(Math.min(to, cursor.to), cls);
      } while (cursor.nextSibling());
      cursor.parent();
    }
  }
}
var t = Tag.define;
var comment = t();
var name = t();
var typeName = t(name);
var propertyName = t(name);
var literal = t();
var string = t(literal);
var number = t(literal);
var content = t();
var heading = t(content);
var keyword = t();
var operator = t();
var punctuation = t();
var bracket = t(punctuation);
var meta = t();
var tags = {
  comment,
  lineComment: t(comment),
  blockComment: t(comment),
  docComment: t(comment),
  name,
  variableName: t(name),
  typeName,
  tagName: t(typeName),
  propertyName,
  attributeName: t(propertyName),
  className: t(name),
  labelName: t(name),
  namespace: t(name),
  macroName: t(name),
  literal,
  string,
  docString: t(string),
  character: t(string),
  attributeValue: t(string),
  number,
  integer: t(number),
  float: t(number),
  bool: t(literal),
  regexp: t(literal),
  escape: t(literal),
  color: t(literal),
  url: t(literal),
  keyword,
  self: t(keyword),
  null: t(keyword),
  atom: t(keyword),
  unit: t(keyword),
  modifier: t(keyword),
  operatorKeyword: t(keyword),
  controlKeyword: t(keyword),
  definitionKeyword: t(keyword),
  moduleKeyword: t(keyword),
  operator,
  derefOperator: t(operator),
  arithmeticOperator: t(operator),
  logicOperator: t(operator),
  bitwiseOperator: t(operator),
  compareOperator: t(operator),
  updateOperator: t(operator),
  definitionOperator: t(operator),
  typeOperator: t(operator),
  controlOperator: t(operator),
  punctuation,
  separator: t(punctuation),
  bracket,
  angleBracket: t(bracket),
  squareBracket: t(bracket),
  paren: t(bracket),
  brace: t(bracket),
  content,
  heading,
  heading1: t(heading),
  heading2: t(heading),
  heading3: t(heading),
  heading4: t(heading),
  heading5: t(heading),
  heading6: t(heading),
  contentSeparator: t(content),
  list: t(content),
  quote: t(content),
  emphasis: t(content),
  strong: t(content),
  link: t(content),
  monospace: t(content),
  strikethrough: t(content),
  inserted: t(),
  deleted: t(),
  changed: t(),
  invalid: t(),
  meta,
  documentMeta: t(meta),
  annotation: t(meta),
  processingInstruction: t(meta),
  definition: Tag.defineModifier(),
  constant: Tag.defineModifier(),
  function: Tag.defineModifier(),
  standard: Tag.defineModifier(),
  local: Tag.defineModifier(),
  special: Tag.defineModifier()
};
var classHighlighter = tagHighlighter([
  { tag: tags.link, class: "tok-link" },
  { tag: tags.heading, class: "tok-heading" },
  { tag: tags.emphasis, class: "tok-emphasis" },
  { tag: tags.strong, class: "tok-strong" },
  { tag: tags.keyword, class: "tok-keyword" },
  { tag: tags.atom, class: "tok-atom" },
  { tag: tags.bool, class: "tok-bool" },
  { tag: tags.url, class: "tok-url" },
  { tag: tags.labelName, class: "tok-labelName" },
  { tag: tags.inserted, class: "tok-inserted" },
  { tag: tags.deleted, class: "tok-deleted" },
  { tag: tags.literal, class: "tok-literal" },
  { tag: tags.string, class: "tok-string" },
  { tag: tags.number, class: "tok-number" },
  { tag: [tags.regexp, tags.escape, tags.special(tags.string)], class: "tok-string2" },
  { tag: tags.variableName, class: "tok-variableName" },
  { tag: tags.local(tags.variableName), class: "tok-variableName tok-local" },
  { tag: tags.definition(tags.variableName), class: "tok-variableName tok-definition" },
  { tag: tags.special(tags.variableName), class: "tok-variableName2" },
  { tag: tags.definition(tags.propertyName), class: "tok-propertyName tok-definition" },
  { tag: tags.typeName, class: "tok-typeName" },
  { tag: tags.namespace, class: "tok-namespace" },
  { tag: tags.className, class: "tok-className" },
  { tag: tags.macroName, class: "tok-macroName" },
  { tag: tags.propertyName, class: "tok-propertyName" },
  { tag: tags.operator, class: "tok-operator" },
  { tag: tags.comment, class: "tok-comment" },
  { tag: tags.meta, class: "tok-meta" },
  { tag: tags.invalid, class: "tok-invalid" },
  { tag: tags.punctuation, class: "tok-punctuation" }
]);

// /home/ray/Code/diagramatics-site/node_modules/@codemirror/language/dist/index.js
var defineLanguageFacet = function(baseData) {
  return Facet.define({
    combine: baseData ? (values) => values.concat(baseData) : undefined
  });
};
var topNodeAt = function(state3, pos, side) {
  let topLang = state3.facet(language), tree = syntaxTree(state3).topNode;
  if (!topLang || topLang.allowsNesting) {
    for (let node = tree;node; node = node.enter(pos, side, IterMode.ExcludeBuffers))
      if (node.type.isTop)
        tree = node;
  }
  return tree;
};
var syntaxTree = function(state3) {
  let field = state3.field(Language.state, false);
  return field ? field.tree : Tree.empty;
};
var cutFragments = function(fragments, from, to) {
  return TreeFragment.applyChanges(fragments, [{ fromA: from, toA: to, fromB: from, toB: to }]);
};
var getIndentUnit = function(state3) {
  let unit = state3.facet(indentUnit);
  return unit.charCodeAt(0) == 9 ? state3.tabSize * unit.length : unit.length;
};
var indentString = function(state3, cols) {
  let result = "", ts = state3.tabSize, ch = state3.facet(indentUnit)[0];
  if (ch == "\t") {
    while (cols >= ts) {
      result += "\t";
      cols -= ts;
    }
    ch = " ";
  }
  for (let i = 0;i < cols; i++)
    result += ch;
  return result;
};
var getIndentation = function(context, pos) {
  if (context instanceof EditorState)
    context = new IndentContext(context);
  for (let service of context.state.facet(indentService)) {
    let result = service(context, pos);
    if (result !== undefined)
      return result;
  }
  let tree = syntaxTree(context.state);
  return tree.length >= pos ? syntaxIndentation(context, tree, pos) : null;
};
var syntaxIndentation = function(cx, ast, pos) {
  return indentFrom(ast.resolveInner(pos).enterUnfinishedNodesBefore(pos), pos, cx);
};
var ignoreClosed = function(cx) {
  return cx.pos == cx.options.simulateBreak && cx.options.simulateDoubleBreak;
};
var indentStrategy = function(tree) {
  let strategy = tree.type.prop(indentNodeProp);
  if (strategy)
    return strategy;
  let first = tree.firstChild, close;
  if (first && (close = first.type.prop(NodeProp.closedBy))) {
    let last = tree.lastChild, closed = last && close.indexOf(last.name) > -1;
    return (cx) => delimitedStrategy(cx, true, 1, undefined, closed && !ignoreClosed(cx) ? last.from : undefined);
  }
  return tree.parent == null ? topIndent : null;
};
var indentFrom = function(node, pos, base2) {
  for (;node; node = node.parent) {
    let strategy = indentStrategy(node);
    if (strategy)
      return strategy(TreeIndentContext.create(base2, pos, node));
  }
  return null;
};
var topIndent = function() {
  return 0;
};
var isParent = function(parent, of) {
  for (let cur = of;cur; cur = cur.parent)
    if (parent == cur)
      return true;
  return false;
};
var bracketedAligned = function(context) {
  let tree = context.node;
  let openToken = tree.childAfter(tree.from), last = tree.lastChild;
  if (!openToken)
    return null;
  let sim = context.options.simulateBreak;
  let openLine = context.state.doc.lineAt(openToken.from);
  let lineEnd = sim == null || sim <= openLine.from ? openLine.to : Math.min(openLine.to, sim);
  for (let pos = openToken.to;; ) {
    let next = tree.childAfter(pos);
    if (!next || next == last)
      return null;
    if (!next.type.isSkipped)
      return next.from < lineEnd ? openToken : null;
    pos = next.to;
  }
};
var delimitedIndent = function({ closing, align = true, units = 1 }) {
  return (context) => delimitedStrategy(context, align, units, closing);
};
var delimitedStrategy = function(context, align, units, closing, closedAt) {
  let after = context.textAfter, space = after.match(/^\s*/)[0].length;
  let closed = closing && after.slice(space, space + closing.length) == closing || closedAt == context.pos + space;
  let aligned = align ? bracketedAligned(context) : null;
  if (aligned)
    return closed ? context.column(aligned.from) : context.column(aligned.to);
  return context.baseIndent + (closed ? 0 : context.unit * units);
};
var continuedIndent = function({ except, units = 1 } = {}) {
  return (context) => {
    let matchExcept = except && except.test(context.textAfter);
    return context.baseIndent + (matchExcept ? 0 : units * context.unit);
  };
};
var indentOnInput = function() {
  return EditorState.transactionFilter.of((tr) => {
    if (!tr.docChanged || !tr.isUserEvent("input.type") && !tr.isUserEvent("input.complete"))
      return tr;
    let rules = tr.startState.languageDataAt("indentOnInput", tr.startState.selection.main.head);
    if (!rules.length)
      return tr;
    let doc2 = tr.newDoc, { head } = tr.newSelection.main, line = doc2.lineAt(head);
    if (head > line.from + DontIndentBeyond)
      return tr;
    let lineStart = doc2.sliceString(line.from, head);
    if (!rules.some((r) => r.test(lineStart)))
      return tr;
    let { state: state3 } = tr, last = -1, changes = [];
    for (let { head: head2 } of state3.selection.ranges) {
      let line2 = state3.doc.lineAt(head2);
      if (line2.from == last)
        continue;
      last = line2.from;
      let indent = getIndentation(state3, line2.from);
      if (indent == null)
        continue;
      let cur = /^\s*/.exec(line2.text)[0];
      let norm = indentString(state3, indent);
      if (cur != norm)
        changes.push({ from: line2.from, to: line2.from + cur.length, insert: norm });
    }
    return changes.length ? [tr, { changes, sequential: true }] : tr;
  });
};
var foldInside = function(node) {
  let { firstChild: first, lastChild: last } = node;
  return first && first.to < last.from ? { from: first.to, to: last.type.isError ? node.to : last.from } : null;
};
var syntaxFolding = function(state3, start, end) {
  let tree = syntaxTree(state3);
  if (tree.length < end)
    return null;
  let inner = tree.resolveInner(end, 1);
  let found = null;
  for (let cur = inner;cur; cur = cur.parent) {
    if (cur.to <= end || cur.from > end)
      continue;
    if (found && cur.from < start)
      break;
    let prop = cur.type.prop(foldNodeProp);
    if (prop && (cur.to < tree.length - 50 || tree.length == state3.doc.length || !isUnfinished(cur))) {
      let value = prop(cur, state3);
      if (value && value.from <= end && value.from >= start && value.to > end)
        found = value;
    }
  }
  return found;
};
var isUnfinished = function(node) {
  let ch = node.lastChild;
  return ch && ch.to == node.to && ch.type.isError;
};
var foldable = function(state3, lineStart, lineEnd) {
  for (let service of state3.facet(foldService)) {
    let result = service(state3, lineStart, lineEnd);
    if (result)
      return result;
  }
  return syntaxFolding(state3, lineStart, lineEnd);
};
var mapRange = function(range, mapping) {
  let from = mapping.mapPos(range.from, 1), to = mapping.mapPos(range.to, -1);
  return from >= to ? undefined : { from, to };
};
var selectedLines = function(view2) {
  let lines = [];
  for (let { head } of view2.state.selection.ranges) {
    if (lines.some((l) => l.from <= head && l.to >= head))
      continue;
    lines.push(view2.lineBlockAt(head));
  }
  return lines;
};
var findFold = function(state3, from, to) {
  var _a;
  let found = null;
  (_a = state3.field(foldState, false)) === null || _a === undefined || _a.between(from, to, (from2, to2) => {
    if (!found || found.from > from2)
      found = { from: from2, to: to2 };
  });
  return found;
};
var foldExists = function(folded, from, to) {
  let found = false;
  folded.between(from, from, (a, b) => {
    if (a == from && b == to)
      found = true;
  });
  return found;
};
var maybeEnable = function(state3, other) {
  return state3.field(foldState, false) ? other : other.concat(StateEffect.appendConfig.of(codeFolding()));
};
var announceFold = function(view2, range, fold = true) {
  let lineFrom = view2.state.doc.lineAt(range.from).number, lineTo = view2.state.doc.lineAt(range.to).number;
  return EditorView.announce.of(`${view2.state.phrase(fold ? "Folded lines" : "Unfolded lines")} ${lineFrom} ${view2.state.phrase("to")} ${lineTo}.`);
};
var codeFolding = function(config) {
  let result = [foldState, baseTheme$12];
  if (config)
    result.push(foldConfig.of(config));
  return result;
};
var widgetToDOM = function(view2, prepared) {
  let { state: state3 } = view2, conf = state3.facet(foldConfig);
  let onclick = (event) => {
    let line = view2.lineBlockAt(view2.posAtDOM(event.target));
    let folded = findFold(view2.state, line.from, line.to);
    if (folded)
      view2.dispatch({ effects: unfoldEffect.of(folded) });
    event.preventDefault();
  };
  if (conf.placeholderDOM)
    return conf.placeholderDOM(view2, onclick, prepared);
  let element = document.createElement("span");
  element.textContent = conf.placeholderText;
  element.setAttribute("aria-label", state3.phrase("folded code"));
  element.title = state3.phrase("unfold");
  element.className = "cm-foldPlaceholder";
  element.onclick = onclick;
  return element;
};
var foldGutter = function(config = {}) {
  let fullConfig = Object.assign(Object.assign({}, foldGutterDefaults), config);
  let canFold = new FoldMarker(fullConfig, true), canUnfold = new FoldMarker(fullConfig, false);
  let markers = ViewPlugin.fromClass(class {
    constructor(view2) {
      this.from = view2.viewport.from;
      this.markers = this.buildMarkers(view2);
    }
    update(update) {
      if (update.docChanged || update.viewportChanged || update.startState.facet(language) != update.state.facet(language) || update.startState.field(foldState, false) != update.state.field(foldState, false) || syntaxTree(update.startState) != syntaxTree(update.state) || fullConfig.foldingChanged(update))
        this.markers = this.buildMarkers(update.view);
    }
    buildMarkers(view2) {
      let builder = new RangeSetBuilder;
      for (let line of view2.viewportLineBlocks) {
        let mark = findFold(view2.state, line.from, line.to) ? canUnfold : foldable(view2.state, line.from, line.to) ? canFold : null;
        if (mark)
          builder.add(line.from, line.from, mark);
      }
      return builder.finish();
    }
  });
  let { domEventHandlers } = fullConfig;
  return [
    markers,
    gutter({
      class: "cm-foldGutter",
      markers(view2) {
        var _a;
        return ((_a = view2.plugin(markers)) === null || _a === undefined ? undefined : _a.markers) || RangeSet.empty;
      },
      initialSpacer() {
        return new FoldMarker(fullConfig, false);
      },
      domEventHandlers: Object.assign(Object.assign({}, domEventHandlers), { click: (view2, line, event) => {
        if (domEventHandlers.click && domEventHandlers.click(view2, line, event))
          return true;
        let folded = findFold(view2.state, line.from, line.to);
        if (folded) {
          view2.dispatch({ effects: unfoldEffect.of(folded) });
          return true;
        }
        let range = foldable(view2.state, line.from, line.to);
        if (range) {
          view2.dispatch({ effects: foldEffect.of(range) });
          return true;
        }
        return false;
      } })
    }),
    codeFolding()
  ];
};
var getHighlighters = function(state3) {
  let main = state3.facet(highlighterFacet);
  return main.length ? main : state3.facet(fallbackHighlighter);
};
var syntaxHighlighting = function(highlighter, options) {
  let ext = [treeHighlighter], themeType;
  if (highlighter instanceof HighlightStyle) {
    if (highlighter.module)
      ext.push(EditorView.styleModule.of(highlighter.module));
    themeType = highlighter.themeType;
  }
  if (options === null || options === undefined ? undefined : options.fallback)
    ext.push(fallbackHighlighter.of(highlighter));
  else if (themeType)
    ext.push(highlighterFacet.computeN([EditorView.darkTheme], (state3) => {
      return state3.facet(EditorView.darkTheme) == (themeType == "dark") ? [highlighter] : [];
    }));
  else
    ext.push(highlighterFacet.of(highlighter));
  return ext;
};
var defaultRenderMatch = function(match) {
  let decorations2 = [];
  let mark = match.matched ? matchingMark : nonmatchingMark;
  decorations2.push(mark.range(match.start.from, match.start.to));
  if (match.end)
    decorations2.push(mark.range(match.end.from, match.end.to));
  return decorations2;
};
var bracketMatching = function(config = {}) {
  return [bracketMatchingConfig.of(config), bracketMatchingUnique];
};
var matchingNodes = function(node, dir, brackets) {
  let byProp = node.prop(dir < 0 ? NodeProp.openedBy : NodeProp.closedBy);
  if (byProp)
    return byProp;
  if (node.name.length == 1) {
    let index = brackets.indexOf(node.name);
    if (index > -1 && index % 2 == (dir < 0 ? 1 : 0))
      return [brackets[index + dir]];
  }
  return null;
};
var findHandle = function(node) {
  let hasHandle = node.type.prop(bracketMatchingHandle);
  return hasHandle ? hasHandle(node.node) : node;
};
var matchBrackets = function(state3, pos, dir, config = {}) {
  let maxScanDistance = config.maxScanDistance || DefaultScanDist, brackets = config.brackets || DefaultBrackets;
  let tree = syntaxTree(state3), node = tree.resolveInner(pos, dir);
  for (let cur = node;cur; cur = cur.parent) {
    let matches = matchingNodes(cur.type, dir, brackets);
    if (matches && cur.from < cur.to) {
      let handle = findHandle(cur);
      if (handle && (dir > 0 ? pos >= handle.from && pos < handle.to : pos > handle.from && pos <= handle.to))
        return matchMarkedBrackets(state3, pos, dir, cur, handle, matches, brackets);
    }
  }
  return matchPlainBrackets(state3, pos, dir, tree, node.type, maxScanDistance, brackets);
};
var matchMarkedBrackets = function(_state, _pos, dir, token, handle, matching, brackets) {
  let parent = token.parent, firstToken = { from: handle.from, to: handle.to };
  let depth = 0, cursor = parent === null || parent === undefined ? undefined : parent.cursor();
  if (cursor && (dir < 0 ? cursor.childBefore(token.from) : cursor.childAfter(token.to)))
    do {
      if (dir < 0 ? cursor.to <= token.from : cursor.from >= token.to) {
        if (depth == 0 && matching.indexOf(cursor.type.name) > -1 && cursor.from < cursor.to) {
          let endHandle = findHandle(cursor);
          return { start: firstToken, end: endHandle ? { from: endHandle.from, to: endHandle.to } : undefined, matched: true };
        } else if (matchingNodes(cursor.type, dir, brackets)) {
          depth++;
        } else if (matchingNodes(cursor.type, -dir, brackets)) {
          if (depth == 0) {
            let endHandle = findHandle(cursor);
            return {
              start: firstToken,
              end: endHandle && endHandle.from < endHandle.to ? { from: endHandle.from, to: endHandle.to } : undefined,
              matched: false
            };
          }
          depth--;
        }
      }
    } while (dir < 0 ? cursor.prevSibling() : cursor.nextSibling());
  return { start: firstToken, matched: false };
};
var matchPlainBrackets = function(state3, pos, dir, tree, tokenType, maxScanDistance, brackets) {
  let startCh = dir < 0 ? state3.sliceDoc(pos - 1, pos) : state3.sliceDoc(pos, pos + 1);
  let bracket2 = brackets.indexOf(startCh);
  if (bracket2 < 0 || bracket2 % 2 == 0 != dir > 0)
    return null;
  let startToken = { from: dir < 0 ? pos - 1 : pos, to: dir > 0 ? pos + 1 : pos };
  let iter = state3.doc.iterRange(pos, dir > 0 ? state3.doc.length : 0), depth = 0;
  for (let distance = 0;!iter.next().done && distance <= maxScanDistance; ) {
    let text = iter.value;
    if (dir < 0)
      distance += text.length;
    let basePos = pos + distance * dir;
    for (let pos2 = dir > 0 ? 0 : text.length - 1, end = dir > 0 ? text.length : -1;pos2 != end; pos2 += dir) {
      let found = brackets.indexOf(text[pos2]);
      if (found < 0 || tree.resolveInner(basePos + pos2, 1).type != tokenType)
        continue;
      if (found % 2 == 0 == dir > 0) {
        depth++;
      } else if (depth == 1) {
        return { start: startToken, end: { from: basePos + pos2, to: basePos + pos2 + 1 }, matched: found >> 1 == bracket2 >> 1 };
      } else {
        depth--;
      }
    }
    if (dir > 0)
      distance += text.length;
  }
  return iter.done ? { start: startToken, matched: false } : null;
};
var warnForPart = function(part, msg) {
  if (warned.indexOf(part) > -1)
    return;
  warned.push(part);
  console.warn(msg);
};
var createTokenType = function(extra, tagStr) {
  let tag = null;
  for (let part of tagStr.split(".")) {
    let value = extra[part] || tags[part];
    if (!value) {
      warnForPart(part, `Unknown highlighting tag ${part}`);
    } else if (typeof value == "function") {
      if (!tag)
        warnForPart(part, `Modifier ${part} used at start of tag`);
      else
        tag = value(tag);
    } else {
      if (tag)
        warnForPart(part, `Tag ${part} used as modifier`);
      else
        tag = value;
    }
  }
  if (!tag)
    return 0;
  let name2 = tagStr.replace(/ /g, "_"), type = NodeType.define({
    id: typeArray.length,
    name: name2,
    props: [styleTags({ [name2]: tag })]
  });
  typeArray.push(type);
  return type.id;
};
var _a;
var languageDataProp = new NodeProp;
var sublanguageProp = new NodeProp;

class Language {
  constructor(data, parser, extraExtensions = [], name2 = "") {
    this.data = data;
    this.name = name2;
    if (!EditorState.prototype.hasOwnProperty("tree"))
      Object.defineProperty(EditorState.prototype, "tree", { get() {
        return syntaxTree(this);
      } });
    this.parser = parser;
    this.extension = [
      language.of(this),
      EditorState.languageData.of((state3, pos, side) => {
        let top2 = topNodeAt(state3, pos, side), data2 = top2.type.prop(languageDataProp);
        if (!data2)
          return [];
        let base2 = state3.facet(data2), sub = top2.type.prop(sublanguageProp);
        if (sub) {
          let innerNode = top2.resolve(pos - top2.from, side);
          for (let sublang of sub)
            if (sublang.test(innerNode, state3)) {
              let data3 = state3.facet(sublang.facet);
              return sublang.type == "replace" ? data3 : data3.concat(base2);
            }
        }
        return base2;
      })
    ].concat(extraExtensions);
  }
  isActiveAt(state3, pos, side = -1) {
    return topNodeAt(state3, pos, side).type.prop(languageDataProp) == this.data;
  }
  findRegions(state3) {
    let lang = state3.facet(language);
    if ((lang === null || lang === undefined ? undefined : lang.data) == this.data)
      return [{ from: 0, to: state3.doc.length }];
    if (!lang || !lang.allowsNesting)
      return [];
    let result = [];
    let explore = (tree, from) => {
      if (tree.prop(languageDataProp) == this.data) {
        result.push({ from, to: from + tree.length });
        return;
      }
      let mount = tree.prop(NodeProp.mounted);
      if (mount) {
        if (mount.tree.prop(languageDataProp) == this.data) {
          if (mount.overlay)
            for (let r of mount.overlay)
              result.push({ from: r.from + from, to: r.to + from });
          else
            result.push({ from, to: from + tree.length });
          return;
        } else if (mount.overlay) {
          let size = result.length;
          explore(mount.tree, mount.overlay[0].from + from);
          if (result.length > size)
            return;
        }
      }
      for (let i = 0;i < tree.children.length; i++) {
        let ch = tree.children[i];
        if (ch instanceof Tree)
          explore(ch, tree.positions[i] + from);
      }
    };
    explore(syntaxTree(state3), 0);
    return result;
  }
  get allowsNesting() {
    return true;
  }
}
Language.setState = StateEffect.define();

class LRLanguage extends Language {
  constructor(data, parser, name2) {
    super(data, parser, [], name2);
    this.parser = parser;
  }
  static define(spec) {
    let data = defineLanguageFacet(spec.languageData);
    return new LRLanguage(data, spec.parser.configure({
      props: [languageDataProp.add((type) => type.isTop ? data : undefined)]
    }), spec.name);
  }
  configure(options, name2) {
    return new LRLanguage(this.data, this.parser.configure(options), name2 || this.name);
  }
  get allowsNesting() {
    return this.parser.hasWrappers();
  }
}

class DocInput {
  constructor(doc2) {
    this.doc = doc2;
    this.cursorPos = 0;
    this.string = "";
    this.cursor = doc2.iter();
  }
  get length() {
    return this.doc.length;
  }
  syncTo(pos) {
    this.string = this.cursor.next(pos - this.cursorPos).value;
    this.cursorPos = pos + this.string.length;
    return this.cursorPos - this.string.length;
  }
  chunk(pos) {
    this.syncTo(pos);
    return this.string;
  }
  get lineChunks() {
    return true;
  }
  read(from, to) {
    let stringStart = this.cursorPos - this.string.length;
    if (from < stringStart || to >= this.cursorPos)
      return this.doc.sliceString(from, to);
    else
      return this.string.slice(from - stringStart, to - stringStart);
  }
}
var currentContext = null;

class ParseContext {
  constructor(parser, state3, fragments = [], tree, treeLen, viewport, skipped, scheduleOn) {
    this.parser = parser;
    this.state = state3;
    this.fragments = fragments;
    this.tree = tree;
    this.treeLen = treeLen;
    this.viewport = viewport;
    this.skipped = skipped;
    this.scheduleOn = scheduleOn;
    this.parse = null;
    this.tempSkipped = [];
  }
  static create(parser, state3, viewport) {
    return new ParseContext(parser, state3, [], Tree.empty, 0, viewport, [], null);
  }
  startParse() {
    return this.parser.startParse(new DocInput(this.state.doc), this.fragments);
  }
  work(until, upto) {
    if (upto != null && upto >= this.state.doc.length)
      upto = undefined;
    if (this.tree != Tree.empty && this.isDone(upto !== null && upto !== undefined ? upto : this.state.doc.length)) {
      this.takeTree();
      return true;
    }
    return this.withContext(() => {
      var _a2;
      if (typeof until == "number") {
        let endTime = Date.now() + until;
        until = () => Date.now() > endTime;
      }
      if (!this.parse)
        this.parse = this.startParse();
      if (upto != null && (this.parse.stoppedAt == null || this.parse.stoppedAt > upto) && upto < this.state.doc.length)
        this.parse.stopAt(upto);
      for (;; ) {
        let done = this.parse.advance();
        if (done) {
          this.fragments = this.withoutTempSkipped(TreeFragment.addTree(done, this.fragments, this.parse.stoppedAt != null));
          this.treeLen = (_a2 = this.parse.stoppedAt) !== null && _a2 !== undefined ? _a2 : this.state.doc.length;
          this.tree = done;
          this.parse = null;
          if (this.treeLen < (upto !== null && upto !== undefined ? upto : this.state.doc.length))
            this.parse = this.startParse();
          else
            return true;
        }
        if (until())
          return false;
      }
    });
  }
  takeTree() {
    let pos, tree;
    if (this.parse && (pos = this.parse.parsedPos) >= this.treeLen) {
      if (this.parse.stoppedAt == null || this.parse.stoppedAt > pos)
        this.parse.stopAt(pos);
      this.withContext(() => {
        while (!(tree = this.parse.advance())) {
        }
      });
      this.treeLen = pos;
      this.tree = tree;
      this.fragments = this.withoutTempSkipped(TreeFragment.addTree(this.tree, this.fragments, true));
      this.parse = null;
    }
  }
  withContext(f) {
    let prev = currentContext;
    currentContext = this;
    try {
      return f();
    } finally {
      currentContext = prev;
    }
  }
  withoutTempSkipped(fragments) {
    for (let r;r = this.tempSkipped.pop(); )
      fragments = cutFragments(fragments, r.from, r.to);
    return fragments;
  }
  changes(changes, newState) {
    let { fragments, tree, treeLen, viewport, skipped } = this;
    this.takeTree();
    if (!changes.empty) {
      let ranges = [];
      changes.iterChangedRanges((fromA, toA, fromB, toB) => ranges.push({ fromA, toA, fromB, toB }));
      fragments = TreeFragment.applyChanges(fragments, ranges);
      tree = Tree.empty;
      treeLen = 0;
      viewport = { from: changes.mapPos(viewport.from, -1), to: changes.mapPos(viewport.to, 1) };
      if (this.skipped.length) {
        skipped = [];
        for (let r of this.skipped) {
          let from = changes.mapPos(r.from, 1), to = changes.mapPos(r.to, -1);
          if (from < to)
            skipped.push({ from, to });
        }
      }
    }
    return new ParseContext(this.parser, newState, fragments, tree, treeLen, viewport, skipped, this.scheduleOn);
  }
  updateViewport(viewport) {
    if (this.viewport.from == viewport.from && this.viewport.to == viewport.to)
      return false;
    this.viewport = viewport;
    let startLen = this.skipped.length;
    for (let i = 0;i < this.skipped.length; i++) {
      let { from, to } = this.skipped[i];
      if (from < viewport.to && to > viewport.from) {
        this.fragments = cutFragments(this.fragments, from, to);
        this.skipped.splice(i--, 1);
      }
    }
    if (this.skipped.length >= startLen)
      return false;
    this.reset();
    return true;
  }
  reset() {
    if (this.parse) {
      this.takeTree();
      this.parse = null;
    }
  }
  skipUntilInView(from, to) {
    this.skipped.push({ from, to });
  }
  static getSkippingParser(until) {
    return new class extends Parser {
      createParse(input, fragments, ranges) {
        let from = ranges[0].from, to = ranges[ranges.length - 1].to;
        let parser = {
          parsedPos: from,
          advance() {
            let cx = currentContext;
            if (cx) {
              for (let r of ranges)
                cx.tempSkipped.push(r);
              if (until)
                cx.scheduleOn = cx.scheduleOn ? Promise.all([cx.scheduleOn, until]) : until;
            }
            this.parsedPos = to;
            return new Tree(NodeType.none, [], [], to - from);
          },
          stoppedAt: null,
          stopAt() {
          }
        };
        return parser;
      }
    };
  }
  isDone(upto) {
    upto = Math.min(upto, this.state.doc.length);
    let frags = this.fragments;
    return this.treeLen >= upto && frags.length && frags[0].from == 0 && frags[0].to >= upto;
  }
  static get() {
    return currentContext;
  }
}

class LanguageState {
  constructor(context) {
    this.context = context;
    this.tree = context.tree;
  }
  apply(tr) {
    if (!tr.docChanged && this.tree == this.context.tree)
      return this;
    let newCx = this.context.changes(tr.changes, tr.state);
    let upto = this.context.treeLen == tr.startState.doc.length ? undefined : Math.max(tr.changes.mapPos(this.context.treeLen), newCx.viewport.to);
    if (!newCx.work(20, upto))
      newCx.takeTree();
    return new LanguageState(newCx);
  }
  static init(state3) {
    let vpTo = Math.min(3000, state3.doc.length);
    let parseState = ParseContext.create(state3.facet(language).parser, state3, { from: 0, to: vpTo });
    if (!parseState.work(20, vpTo))
      parseState.takeTree();
    return new LanguageState(parseState);
  }
}
Language.state = StateField.define({
  create: LanguageState.init,
  update(value, tr) {
    for (let e of tr.effects)
      if (e.is(Language.setState))
        return e.value;
    if (tr.startState.facet(language) != tr.state.facet(language))
      return LanguageState.init(tr.state);
    return value.apply(tr);
  }
});
var requestIdle = (callback) => {
  let timeout = setTimeout(() => callback(), 500);
  return () => clearTimeout(timeout);
};
if (typeof requestIdleCallback != "undefined")
  requestIdle = (callback) => {
    let idle = -1, timeout = setTimeout(() => {
      idle = requestIdleCallback(callback, { timeout: 500 - 100 });
    }, 100);
    return () => idle < 0 ? clearTimeout(timeout) : cancelIdleCallback(idle);
  };
var isInputPending = typeof navigator != "undefined" && ((_a = navigator.scheduling) === null || _a === undefined ? undefined : _a.isInputPending) ? () => navigator.scheduling.isInputPending() : null;
var parseWorker = ViewPlugin.fromClass(class ParseWorker {
  constructor(view2) {
    this.view = view2;
    this.working = null;
    this.workScheduled = 0;
    this.chunkEnd = -1;
    this.chunkBudget = -1;
    this.work = this.work.bind(this);
    this.scheduleWork();
  }
  update(update) {
    let cx = this.view.state.field(Language.state).context;
    if (cx.updateViewport(update.view.viewport) || this.view.viewport.to > cx.treeLen)
      this.scheduleWork();
    if (update.docChanged) {
      if (this.view.hasFocus)
        this.chunkBudget += 50;
      this.scheduleWork();
    }
    this.checkAsyncSchedule(cx);
  }
  scheduleWork() {
    if (this.working)
      return;
    let { state: state3 } = this.view, field = state3.field(Language.state);
    if (field.tree != field.context.tree || !field.context.isDone(state3.doc.length))
      this.working = requestIdle(this.work);
  }
  work(deadline) {
    this.working = null;
    let now = Date.now();
    if (this.chunkEnd < now && (this.chunkEnd < 0 || this.view.hasFocus)) {
      this.chunkEnd = now + 30000;
      this.chunkBudget = 3000;
    }
    if (this.chunkBudget <= 0)
      return;
    let { state: state3, viewport: { to: vpTo } } = this.view, field = state3.field(Language.state);
    if (field.tree == field.context.tree && field.context.isDone(vpTo + 1e5))
      return;
    let endTime = Date.now() + Math.min(this.chunkBudget, 100, deadline && !isInputPending ? Math.max(25, deadline.timeRemaining() - 5) : 1e9);
    let viewportFirst = field.context.treeLen < vpTo && state3.doc.length > vpTo + 1000;
    let done = field.context.work(() => {
      return isInputPending && isInputPending() || Date.now() > endTime;
    }, vpTo + (viewportFirst ? 0 : 1e5));
    this.chunkBudget -= Date.now() - now;
    if (done || this.chunkBudget <= 0) {
      field.context.takeTree();
      this.view.dispatch({ effects: Language.setState.of(new LanguageState(field.context)) });
    }
    if (this.chunkBudget > 0 && !(done && !viewportFirst))
      this.scheduleWork();
    this.checkAsyncSchedule(field.context);
  }
  checkAsyncSchedule(cx) {
    if (cx.scheduleOn) {
      this.workScheduled++;
      cx.scheduleOn.then(() => this.scheduleWork()).catch((err) => logException(this.view.state, err)).then(() => this.workScheduled--);
      cx.scheduleOn = null;
    }
  }
  destroy() {
    if (this.working)
      this.working();
  }
  isWorking() {
    return !!(this.working || this.workScheduled > 0);
  }
}, {
  eventHandlers: { focus() {
    this.scheduleWork();
  } }
});
var language = Facet.define({
  combine(languages) {
    return languages.length ? languages[0] : null;
  },
  enables: (language2) => [
    Language.state,
    parseWorker,
    EditorView.contentAttributes.compute([language2], (state3) => {
      let lang = state3.facet(language2);
      return lang && lang.name ? { "data-language": lang.name } : {};
    })
  ]
});

class LanguageSupport {
  constructor(language2, support = []) {
    this.language = language2;
    this.support = support;
    this.extension = [language2, support];
  }
}
var indentService = Facet.define();
var indentUnit = Facet.define({
  combine: (values) => {
    if (!values.length)
      return "  ";
    let unit = values[0];
    if (!unit || /\S/.test(unit) || Array.from(unit).some((e) => e != unit[0]))
      throw new Error("Invalid indent unit: " + JSON.stringify(values[0]));
    return unit;
  }
});

class IndentContext {
  constructor(state3, options = {}) {
    this.state = state3;
    this.options = options;
    this.unit = getIndentUnit(state3);
  }
  lineAt(pos, bias = 1) {
    let line = this.state.doc.lineAt(pos);
    let { simulateBreak, simulateDoubleBreak } = this.options;
    if (simulateBreak != null && simulateBreak >= line.from && simulateBreak <= line.to) {
      if (simulateDoubleBreak && simulateBreak == pos)
        return { text: "", from: pos };
      else if (bias < 0 ? simulateBreak < pos : simulateBreak <= pos)
        return { text: line.text.slice(simulateBreak - line.from), from: simulateBreak };
      else
        return { text: line.text.slice(0, simulateBreak - line.from), from: line.from };
    }
    return line;
  }
  textAfterPos(pos, bias = 1) {
    if (this.options.simulateDoubleBreak && pos == this.options.simulateBreak)
      return "";
    let { text, from } = this.lineAt(pos, bias);
    return text.slice(pos - from, Math.min(text.length, pos + 100 - from));
  }
  column(pos, bias = 1) {
    let { text, from } = this.lineAt(pos, bias);
    let result = this.countColumn(text, pos - from);
    let override = this.options.overrideIndentation ? this.options.overrideIndentation(from) : -1;
    if (override > -1)
      result += override - this.countColumn(text, text.search(/\S|$/));
    return result;
  }
  countColumn(line, pos = line.length) {
    return countColumn(line, this.state.tabSize, pos);
  }
  lineIndent(pos, bias = 1) {
    let { text, from } = this.lineAt(pos, bias);
    let override = this.options.overrideIndentation;
    if (override) {
      let overriden = override(from);
      if (overriden > -1)
        return overriden;
    }
    return this.countColumn(text, text.search(/\S|$/));
  }
  get simulatedBreak() {
    return this.options.simulateBreak || null;
  }
}
var indentNodeProp = new NodeProp;

class TreeIndentContext extends IndentContext {
  constructor(base2, pos, node) {
    super(base2.state, base2.options);
    this.base = base2;
    this.pos = pos;
    this.node = node;
  }
  static create(base2, pos, node) {
    return new TreeIndentContext(base2, pos, node);
  }
  get textAfter() {
    return this.textAfterPos(this.pos);
  }
  get baseIndent() {
    return this.baseIndentFor(this.node);
  }
  baseIndentFor(node) {
    let line = this.state.doc.lineAt(node.from);
    for (;; ) {
      let atBreak = node.resolve(line.from);
      while (atBreak.parent && atBreak.parent.from == atBreak.from)
        atBreak = atBreak.parent;
      if (isParent(atBreak, node))
        break;
      line = this.state.doc.lineAt(atBreak.from);
    }
    return this.lineIndent(line.from);
  }
  continue() {
    let parent = this.node.parent;
    return parent ? indentFrom(parent, this.pos, this.base) : 0;
  }
}
var flatIndent = (context) => context.baseIndent;
var DontIndentBeyond = 200;
var foldService = Facet.define();
var foldNodeProp = new NodeProp;
var foldEffect = StateEffect.define({ map: mapRange });
var unfoldEffect = StateEffect.define({ map: mapRange });
var foldState = StateField.define({
  create() {
    return Decoration.none;
  },
  update(folded, tr) {
    folded = folded.map(tr.changes);
    for (let e of tr.effects) {
      if (e.is(foldEffect) && !foldExists(folded, e.value.from, e.value.to)) {
        let { preparePlaceholder } = tr.state.facet(foldConfig);
        let widget = !preparePlaceholder ? foldWidget : Decoration.replace({ widget: new PreparedFoldWidget(preparePlaceholder(tr.state, e.value)) });
        folded = folded.update({ add: [widget.range(e.value.from, e.value.to)] });
      } else if (e.is(unfoldEffect)) {
        folded = folded.update({
          filter: (from, to) => e.value.from != from || e.value.to != to,
          filterFrom: e.value.from,
          filterTo: e.value.to
        });
      }
    }
    if (tr.selection) {
      let onSelection = false, { head } = tr.selection.main;
      folded.between(head, head, (a, b) => {
        if (a < head && b > head)
          onSelection = true;
      });
      if (onSelection)
        folded = folded.update({
          filterFrom: head,
          filterTo: head,
          filter: (a, b) => b <= head || a >= head
        });
    }
    return folded;
  },
  provide: (f) => EditorView.decorations.from(f),
  toJSON(folded, state3) {
    let ranges = [];
    folded.between(0, state3.doc.length, (from, to) => {
      ranges.push(from, to);
    });
    return ranges;
  },
  fromJSON(value) {
    if (!Array.isArray(value) || value.length % 2)
      throw new RangeError("Invalid JSON for fold state");
    let ranges = [];
    for (let i = 0;i < value.length; ) {
      let from = value[i++], to = value[i++];
      if (typeof from != "number" || typeof to != "number")
        throw new RangeError("Invalid JSON for fold state");
      ranges.push(foldWidget.range(from, to));
    }
    return Decoration.set(ranges, true);
  }
});
var foldCode = (view2) => {
  for (let line of selectedLines(view2)) {
    let range = foldable(view2.state, line.from, line.to);
    if (range) {
      view2.dispatch({ effects: maybeEnable(view2.state, [foldEffect.of(range), announceFold(view2, range)]) });
      return true;
    }
  }
  return false;
};
var unfoldCode = (view2) => {
  if (!view2.state.field(foldState, false))
    return false;
  let effects = [];
  for (let line of selectedLines(view2)) {
    let folded = findFold(view2.state, line.from, line.to);
    if (folded)
      effects.push(unfoldEffect.of(folded), announceFold(view2, folded, false));
  }
  if (effects.length)
    view2.dispatch({ effects });
  return effects.length > 0;
};
var foldAll = (view2) => {
  let { state: state3 } = view2, effects = [];
  for (let pos = 0;pos < state3.doc.length; ) {
    let line = view2.lineBlockAt(pos), range = foldable(state3, line.from, line.to);
    if (range)
      effects.push(foldEffect.of(range));
    pos = (range ? view2.lineBlockAt(range.to) : line).to + 1;
  }
  if (effects.length)
    view2.dispatch({ effects: maybeEnable(view2.state, effects) });
  return !!effects.length;
};
var unfoldAll = (view2) => {
  let field = view2.state.field(foldState, false);
  if (!field || !field.size)
    return false;
  let effects = [];
  field.between(0, view2.state.doc.length, (from, to) => {
    effects.push(unfoldEffect.of({ from, to }));
  });
  view2.dispatch({ effects });
  return true;
};
var foldKeymap = [
  { key: "Ctrl-Shift-[", mac: "Cmd-Alt-[", run: foldCode },
  { key: "Ctrl-Shift-]", mac: "Cmd-Alt-]", run: unfoldCode },
  { key: "Ctrl-Alt-[", run: foldAll },
  { key: "Ctrl-Alt-]", run: unfoldAll }
];
var defaultConfig = {
  placeholderDOM: null,
  preparePlaceholder: null,
  placeholderText: "\u2026"
};
var foldConfig = Facet.define({
  combine(values) {
    return combineConfig(values, defaultConfig);
  }
});
var foldWidget = Decoration.replace({ widget: new class extends WidgetType {
  toDOM(view2) {
    return widgetToDOM(view2, null);
  }
} });

class PreparedFoldWidget extends WidgetType {
  constructor(value) {
    super();
    this.value = value;
  }
  eq(other) {
    return this.value == other.value;
  }
  toDOM(view2) {
    return widgetToDOM(view2, this.value);
  }
}
var foldGutterDefaults = {
  openText: "\u2304",
  closedText: "\u203A",
  markerDOM: null,
  domEventHandlers: {},
  foldingChanged: () => false
};

class FoldMarker extends GutterMarker {
  constructor(config, open) {
    super();
    this.config = config;
    this.open = open;
  }
  eq(other) {
    return this.config == other.config && this.open == other.open;
  }
  toDOM(view2) {
    if (this.config.markerDOM)
      return this.config.markerDOM(this.open);
    let span = document.createElement("span");
    span.textContent = this.open ? this.config.openText : this.config.closedText;
    span.title = view2.state.phrase(this.open ? "Fold line" : "Unfold line");
    return span;
  }
}
var baseTheme$12 = EditorView.baseTheme({
  ".cm-foldPlaceholder": {
    backgroundColor: "#eee",
    border: "1px solid #ddd",
    color: "#888",
    borderRadius: ".2em",
    margin: "0 1px",
    padding: "0 1px",
    cursor: "pointer"
  },
  ".cm-foldGutter span": {
    padding: "0 1px",
    cursor: "pointer"
  }
});

class HighlightStyle {
  constructor(specs, options) {
    this.specs = specs;
    let modSpec;
    function def(spec) {
      let cls = StyleModule.newName();
      (modSpec || (modSpec = Object.create(null)))["." + cls] = spec;
      return cls;
    }
    const all = typeof options.all == "string" ? options.all : options.all ? def(options.all) : undefined;
    const scopeOpt = options.scope;
    this.scope = scopeOpt instanceof Language ? (type) => type.prop(languageDataProp) == scopeOpt.data : scopeOpt ? (type) => type == scopeOpt : undefined;
    this.style = tagHighlighter(specs.map((style) => ({
      tag: style.tag,
      class: style.class || def(Object.assign({}, style, { tag: null }))
    })), {
      all
    }).style;
    this.module = modSpec ? new StyleModule(modSpec) : null;
    this.themeType = options.themeType;
  }
  static define(specs, options) {
    return new HighlightStyle(specs, options || {});
  }
}
var highlighterFacet = Facet.define();
var fallbackHighlighter = Facet.define({
  combine(values) {
    return values.length ? [values[0]] : null;
  }
});

class TreeHighlighter {
  constructor(view2) {
    this.markCache = Object.create(null);
    this.tree = syntaxTree(view2.state);
    this.decorations = this.buildDeco(view2, getHighlighters(view2.state));
  }
  update(update) {
    let tree = syntaxTree(update.state), highlighters = getHighlighters(update.state);
    let styleChange = highlighters != getHighlighters(update.startState);
    if (tree.length < update.view.viewport.to && !styleChange && tree.type == this.tree.type) {
      this.decorations = this.decorations.map(update.changes);
    } else if (tree != this.tree || update.viewportChanged || styleChange) {
      this.tree = tree;
      this.decorations = this.buildDeco(update.view, highlighters);
    }
  }
  buildDeco(view2, highlighters) {
    if (!highlighters || !this.tree.length)
      return Decoration.none;
    let builder = new RangeSetBuilder;
    for (let { from, to } of view2.visibleRanges) {
      highlightTree(this.tree, highlighters, (from2, to2, style) => {
        builder.add(from2, to2, this.markCache[style] || (this.markCache[style] = Decoration.mark({ class: style })));
      }, from, to);
    }
    return builder.finish();
  }
}
var treeHighlighter = Prec.high(ViewPlugin.fromClass(TreeHighlighter, {
  decorations: (v) => v.decorations
}));
var defaultHighlightStyle = HighlightStyle.define([
  {
    tag: tags.meta,
    color: "#404740"
  },
  {
    tag: tags.link,
    textDecoration: "underline"
  },
  {
    tag: tags.heading,
    textDecoration: "underline",
    fontWeight: "bold"
  },
  {
    tag: tags.emphasis,
    fontStyle: "italic"
  },
  {
    tag: tags.strong,
    fontWeight: "bold"
  },
  {
    tag: tags.strikethrough,
    textDecoration: "line-through"
  },
  {
    tag: tags.keyword,
    color: "#708"
  },
  {
    tag: [tags.atom, tags.bool, tags.url, tags.contentSeparator, tags.labelName],
    color: "#219"
  },
  {
    tag: [tags.literal, tags.inserted],
    color: "#164"
  },
  {
    tag: [tags.string, tags.deleted],
    color: "#a11"
  },
  {
    tag: [tags.regexp, tags.escape, tags.special(tags.string)],
    color: "#e40"
  },
  {
    tag: tags.definition(tags.variableName),
    color: "#00f"
  },
  {
    tag: tags.local(tags.variableName),
    color: "#30a"
  },
  {
    tag: [tags.typeName, tags.namespace],
    color: "#085"
  },
  {
    tag: tags.className,
    color: "#167"
  },
  {
    tag: [tags.special(tags.variableName), tags.macroName],
    color: "#256"
  },
  {
    tag: tags.definition(tags.propertyName),
    color: "#00c"
  },
  {
    tag: tags.comment,
    color: "#940"
  },
  {
    tag: tags.invalid,
    color: "#f00"
  }
]);
var baseTheme2 = EditorView.baseTheme({
  "&.cm-focused .cm-matchingBracket": { backgroundColor: "#328c8252" },
  "&.cm-focused .cm-nonmatchingBracket": { backgroundColor: "#bb555544" }
});
var DefaultScanDist = 1e4;
var DefaultBrackets = "()[]{}";
var bracketMatchingConfig = Facet.define({
  combine(configs) {
    return combineConfig(configs, {
      afterCursor: true,
      brackets: DefaultBrackets,
      maxScanDistance: DefaultScanDist,
      renderMatch: defaultRenderMatch
    });
  }
});
var matchingMark = Decoration.mark({ class: "cm-matchingBracket" });
var nonmatchingMark = Decoration.mark({ class: "cm-nonmatchingBracket" });
var bracketMatchingState = StateField.define({
  create() {
    return Decoration.none;
  },
  update(deco, tr) {
    if (!tr.docChanged && !tr.selection)
      return deco;
    let decorations2 = [];
    let config = tr.state.facet(bracketMatchingConfig);
    for (let range of tr.state.selection.ranges) {
      if (!range.empty)
        continue;
      let match = matchBrackets(tr.state, range.head, -1, config) || range.head > 0 && matchBrackets(tr.state, range.head - 1, 1, config) || config.afterCursor && (matchBrackets(tr.state, range.head, 1, config) || range.head < tr.state.doc.length && matchBrackets(tr.state, range.head + 1, -1, config));
      if (match)
        decorations2 = decorations2.concat(config.renderMatch(match, tr.state));
    }
    return Decoration.set(decorations2, true);
  },
  provide: (f) => EditorView.decorations.from(f)
});
var bracketMatchingUnique = [
  bracketMatchingState,
  baseTheme2
];
var bracketMatchingHandle = new NodeProp;
var noTokens = Object.create(null);
var typeArray = [NodeType.none];
var warned = [];
var defaultTable = Object.create(null);
for (let [legacyName, name2] of [
  ["variable", "variableName"],
  ["variable-2", "variableName.special"],
  ["string-2", "string.special"],
  ["def", "variableName.definition"],
  ["tag", "tagName"],
  ["attribute", "attributeName"],
  ["type", "typeName"],
  ["builtin", "variableName.standard"],
  ["qualifier", "modifier"],
  ["error", "invalid"],
  ["header", "heading"],
  ["property", "propertyName"]
])
  defaultTable[legacyName] = createTokenType(noTokens, name2);

// /home/ray/Code/diagramatics-site/node_modules/@codemirror/commands/dist/index.js
var command = function(f, option) {
  return ({ state: state4, dispatch }) => {
    if (state4.readOnly)
      return false;
    let tr = f(option, state4);
    if (!tr)
      return false;
    dispatch(state4.update(tr));
    return true;
  };
};
var getConfig = function(state4, pos) {
  let data = state4.languageDataAt("commentTokens", pos);
  return data.length ? data[0] : {};
};
var findBlockComment = function(state4, { open, close }, from, to) {
  let textBefore = state4.sliceDoc(from - SearchMargin, from);
  let textAfter = state4.sliceDoc(to, to + SearchMargin);
  let spaceBefore = /\s*$/.exec(textBefore)[0].length, spaceAfter = /^\s*/.exec(textAfter)[0].length;
  let beforeOff = textBefore.length - spaceBefore;
  if (textBefore.slice(beforeOff - open.length, beforeOff) == open && textAfter.slice(spaceAfter, spaceAfter + close.length) == close) {
    return {
      open: { pos: from - spaceBefore, margin: spaceBefore && 1 },
      close: { pos: to + spaceAfter, margin: spaceAfter && 1 }
    };
  }
  let startText, endText;
  if (to - from <= 2 * SearchMargin) {
    startText = endText = state4.sliceDoc(from, to);
  } else {
    startText = state4.sliceDoc(from, from + SearchMargin);
    endText = state4.sliceDoc(to - SearchMargin, to);
  }
  let startSpace = /^\s*/.exec(startText)[0].length, endSpace = /\s*$/.exec(endText)[0].length;
  let endOff = endText.length - endSpace - close.length;
  if (startText.slice(startSpace, startSpace + open.length) == open && endText.slice(endOff, endOff + close.length) == close) {
    return {
      open: {
        pos: from + startSpace + open.length,
        margin: /\s/.test(startText.charAt(startSpace + open.length)) ? 1 : 0
      },
      close: {
        pos: to - endSpace - close.length,
        margin: /\s/.test(endText.charAt(endOff - 1)) ? 1 : 0
      }
    };
  }
  return null;
};
var selectedLineRanges = function(state4) {
  let ranges = [];
  for (let r of state4.selection.ranges) {
    let fromLine = state4.doc.lineAt(r.from);
    let toLine = r.to <= fromLine.to ? fromLine : state4.doc.lineAt(r.to);
    let last = ranges.length - 1;
    if (last >= 0 && ranges[last].to > fromLine.from)
      ranges[last].to = toLine.to;
    else
      ranges.push({ from: fromLine.from + /^\s*/.exec(fromLine.text)[0].length, to: toLine.to });
  }
  return ranges;
};
var changeBlockComment = function(option, state4, ranges = state4.selection.ranges) {
  let tokens = ranges.map((r) => getConfig(state4, r.from).block);
  if (!tokens.every((c) => c))
    return null;
  let comments = ranges.map((r, i) => findBlockComment(state4, tokens[i], r.from, r.to));
  if (option != 2 && !comments.every((c) => c)) {
    return { changes: state4.changes(ranges.map((range, i) => {
      if (comments[i])
        return [];
      return [{ from: range.from, insert: tokens[i].open + " " }, { from: range.to, insert: " " + tokens[i].close }];
    })) };
  } else if (option != 1 && comments.some((c) => c)) {
    let changes = [];
    for (let i = 0, comment2;i < comments.length; i++)
      if (comment2 = comments[i]) {
        let token = tokens[i], { open, close } = comment2;
        changes.push({ from: open.pos - token.open.length, to: open.pos + open.margin }, { from: close.pos - close.margin, to: close.pos + token.close.length });
      }
    return { changes };
  }
  return null;
};
var changeLineComment = function(option, state4, ranges = state4.selection.ranges) {
  let lines = [];
  let prevLine = -1;
  for (let { from, to } of ranges) {
    let startI = lines.length, minIndent = 1e9;
    let token = getConfig(state4, from).line;
    if (!token)
      continue;
    for (let pos = from;pos <= to; ) {
      let line = state4.doc.lineAt(pos);
      if (line.from > prevLine && (from == to || to > line.from)) {
        prevLine = line.from;
        let indent = /^\s*/.exec(line.text)[0].length;
        let empty = indent == line.length;
        let comment2 = line.text.slice(indent, indent + token.length) == token ? indent : -1;
        if (indent < line.text.length && indent < minIndent)
          minIndent = indent;
        lines.push({ line, comment: comment2, token, indent, empty, single: false });
      }
      pos = line.to + 1;
    }
    if (minIndent < 1e9) {
      for (let i = startI;i < lines.length; i++)
        if (lines[i].indent < lines[i].line.text.length)
          lines[i].indent = minIndent;
    }
    if (lines.length == startI + 1)
      lines[startI].single = true;
  }
  if (option != 2 && lines.some((l) => l.comment < 0 && (!l.empty || l.single))) {
    let changes = [];
    for (let { line, token, indent, empty, single } of lines)
      if (single || !empty)
        changes.push({ from: line.from + indent, insert: token + " " });
    let changeSet = state4.changes(changes);
    return { changes: changeSet, selection: state4.selection.map(changeSet, 1) };
  } else if (option != 1 && lines.some((l) => l.comment >= 0)) {
    let changes = [];
    for (let { line, comment: comment2, token } of lines)
      if (comment2 >= 0) {
        let from = line.from + comment2, to = from + token.length;
        if (line.text[to - line.from] == " ")
          to++;
        changes.push({ from, to });
      }
    return { changes };
  }
  return null;
};
var changeEnd = function(changes) {
  let end = 0;
  changes.iterChangedRanges((_, to) => end = to);
  return end;
};
var history = function(config = {}) {
  return [
    historyField_,
    historyConfig.of(config),
    EditorView.domEventHandlers({
      beforeinput(e, view3) {
        let command2 = e.inputType == "historyUndo" ? undo : e.inputType == "historyRedo" ? redo : null;
        if (!command2)
          return false;
        e.preventDefault();
        return command2(view3);
      }
    })
  ];
};
var cmd = function(side, selection) {
  return function({ state: state4, dispatch }) {
    if (!selection && state4.readOnly)
      return false;
    let historyState = state4.field(historyField_, false);
    if (!historyState)
      return false;
    let tr = historyState.pop(side, state4, selection);
    if (!tr)
      return false;
    dispatch(tr);
    return true;
  };
};
var updateBranch = function(branch, to, maxLen, newEvent) {
  let start = to + 1 > maxLen + 20 ? to - maxLen - 1 : 0;
  let newBranch = branch.slice(start, to);
  newBranch.push(newEvent);
  return newBranch;
};
var isAdjacent = function(a, b) {
  let ranges = [], isAdjacent2 = false;
  a.iterChangedRanges((f, t2) => ranges.push(f, t2));
  b.iterChangedRanges((_f, _t, f, t2) => {
    for (let i = 0;i < ranges.length; ) {
      let from = ranges[i++], to = ranges[i++];
      if (t2 >= from && f <= to)
        isAdjacent2 = true;
    }
  });
  return isAdjacent2;
};
var eqSelectionShape = function(a, b) {
  return a.ranges.length == b.ranges.length && a.ranges.filter((r, i) => r.empty != b.ranges[i].empty).length === 0;
};
var conc = function(a, b) {
  return !a.length ? b : !b.length ? a : a.concat(b);
};
var addSelection = function(branch, selection) {
  if (!branch.length) {
    return [HistEvent.selection([selection])];
  } else {
    let lastEvent = branch[branch.length - 1];
    let sels = lastEvent.selectionsAfter.slice(Math.max(0, lastEvent.selectionsAfter.length - MaxSelectionsPerEvent));
    if (sels.length && sels[sels.length - 1].eq(selection))
      return branch;
    sels.push(selection);
    return updateBranch(branch, branch.length - 1, 1e9, lastEvent.setSelAfter(sels));
  }
};
var popSelection = function(branch) {
  let last = branch[branch.length - 1];
  let newBranch = branch.slice();
  newBranch[branch.length - 1] = last.setSelAfter(last.selectionsAfter.slice(0, last.selectionsAfter.length - 1));
  return newBranch;
};
var addMappingToBranch = function(branch, mapping) {
  if (!branch.length)
    return branch;
  let length = branch.length, selections = none2;
  while (length) {
    let event = mapEvent(branch[length - 1], mapping, selections);
    if (event.changes && !event.changes.empty || event.effects.length) {
      let result = branch.slice(0, length);
      result[length - 1] = event;
      return result;
    } else {
      mapping = event.mapped;
      length--;
      selections = event.selectionsAfter;
    }
  }
  return selections.length ? [HistEvent.selection(selections)] : none2;
};
var mapEvent = function(event, mapping, extraSelections) {
  let selections = conc(event.selectionsAfter.length ? event.selectionsAfter.map((s) => s.map(mapping)) : none2, extraSelections);
  if (!event.changes)
    return HistEvent.selection(selections);
  let mappedChanges = event.changes.map(mapping), before = mapping.mapDesc(event.changes, true);
  let fullMapping = event.mapped ? event.mapped.composeDesc(before) : before;
  return new HistEvent(mappedChanges, StateEffect.mapEffects(event.effects, mapping), fullMapping, event.startSelection.map(before), selections);
};
var updateSel = function(sel, by) {
  return EditorSelection.create(sel.ranges.map(by), sel.mainIndex);
};
var setSel = function(state4, selection) {
  return state4.update({ selection, scrollIntoView: true, userEvent: "select" });
};
var moveSel = function({ state: state4, dispatch }, how) {
  let selection = updateSel(state4.selection, how);
  if (selection.eq(state4.selection))
    return false;
  dispatch(setSel(state4, selection));
  return true;
};
var rangeEnd = function(range, forward) {
  return EditorSelection.cursor(forward ? range.to : range.from);
};
var cursorByChar = function(view3, forward) {
  return moveSel(view3, (range) => range.empty ? view3.moveByChar(range, forward) : rangeEnd(range, forward));
};
var ltrAtCursor = function(view3) {
  return view3.textDirectionAt(view3.state.selection.main.head) == Direction.LTR;
};
var cursorByGroup = function(view3, forward) {
  return moveSel(view3, (range) => range.empty ? view3.moveByGroup(range, forward) : rangeEnd(range, forward));
};
var interestingNode = function(state4, node, bracketProp) {
  if (node.type.prop(bracketProp))
    return true;
  let len = node.to - node.from;
  return len && (len > 2 || /[^\s,.;:]/.test(state4.sliceDoc(node.from, node.to))) || node.firstChild;
};
var moveBySyntax = function(state4, start, forward) {
  let pos = syntaxTree(state4).resolveInner(start.head);
  let bracketProp = forward ? NodeProp.closedBy : NodeProp.openedBy;
  for (let at = start.head;; ) {
    let next = forward ? pos.childAfter(at) : pos.childBefore(at);
    if (!next)
      break;
    if (interestingNode(state4, next, bracketProp))
      pos = next;
    else
      at = forward ? next.to : next.from;
  }
  let bracket2 = pos.type.prop(bracketProp), match, newPos;
  if (bracket2 && (match = forward ? matchBrackets(state4, pos.from, 1) : matchBrackets(state4, pos.to, -1)) && match.matched)
    newPos = forward ? match.end.to : match.end.from;
  else
    newPos = forward ? pos.to : pos.from;
  return EditorSelection.cursor(newPos, forward ? -1 : 1);
};
var cursorByLine = function(view3, forward) {
  return moveSel(view3, (range) => {
    if (!range.empty)
      return rangeEnd(range, forward);
    let moved = view3.moveVertically(range, forward);
    return moved.head != range.head ? moved : view3.moveToLineBoundary(range, forward);
  });
};
var pageInfo = function(view3) {
  let selfScroll = view3.scrollDOM.clientHeight < view3.scrollDOM.scrollHeight - 2;
  let marginTop = 0, marginBottom = 0, height;
  if (selfScroll) {
    for (let source of view3.state.facet(EditorView.scrollMargins)) {
      let margins = source(view3);
      if (margins === null || margins === undefined ? undefined : margins.top)
        marginTop = Math.max(margins === null || margins === undefined ? undefined : margins.top, marginTop);
      if (margins === null || margins === undefined ? undefined : margins.bottom)
        marginBottom = Math.max(margins === null || margins === undefined ? undefined : margins.bottom, marginBottom);
    }
    height = view3.scrollDOM.clientHeight - marginTop - marginBottom;
  } else {
    height = (view3.dom.ownerDocument.defaultView || window).innerHeight;
  }
  return {
    marginTop,
    marginBottom,
    selfScroll,
    height: Math.max(view3.defaultLineHeight, height - 5)
  };
};
var cursorByPage = function(view3, forward) {
  let page = pageInfo(view3);
  let { state: state4 } = view3, selection = updateSel(state4.selection, (range) => {
    return range.empty ? view3.moveVertically(range, forward, page.height) : rangeEnd(range, forward);
  });
  if (selection.eq(state4.selection))
    return false;
  let effect;
  if (page.selfScroll) {
    let startPos = view3.coordsAtPos(state4.selection.main.head);
    let scrollRect = view3.scrollDOM.getBoundingClientRect();
    let scrollTop = scrollRect.top + page.marginTop, scrollBottom = scrollRect.bottom - page.marginBottom;
    if (startPos && startPos.top > scrollTop && startPos.bottom < scrollBottom)
      effect = EditorView.scrollIntoView(selection.main.head, { y: "start", yMargin: startPos.top - scrollTop });
  }
  view3.dispatch(setSel(state4, selection), { effects: effect });
  return true;
};
var moveByLineBoundary = function(view3, start, forward) {
  let line = view3.lineBlockAt(start.head), moved = view3.moveToLineBoundary(start, forward);
  if (moved.head == start.head && moved.head != (forward ? line.to : line.from))
    moved = view3.moveToLineBoundary(start, forward, false);
  if (!forward && moved.head == line.from && line.length) {
    let space = /^\s*/.exec(view3.state.sliceDoc(line.from, Math.min(line.from + 100, line.to)))[0].length;
    if (space && start.head != line.from + space)
      moved = EditorSelection.cursor(line.from + space);
  }
  return moved;
};
var toMatchingBracket = function(state4, dispatch, extend2) {
  let found = false, selection = updateSel(state4.selection, (range) => {
    let matching = matchBrackets(state4, range.head, -1) || matchBrackets(state4, range.head, 1) || range.head > 0 && matchBrackets(state4, range.head - 1, 1) || range.head < state4.doc.length && matchBrackets(state4, range.head + 1, -1);
    if (!matching || !matching.end)
      return range;
    found = true;
    let head = matching.start.from == range.head ? matching.end.to : matching.end.from;
    return extend2 ? EditorSelection.range(range.anchor, head) : EditorSelection.cursor(head);
  });
  if (!found)
    return false;
  dispatch(setSel(state4, selection));
  return true;
};
var extendSel = function(view3, how) {
  let selection = updateSel(view3.state.selection, (range) => {
    let head = how(range);
    return EditorSelection.range(range.anchor, head.head, head.goalColumn, head.bidiLevel || undefined);
  });
  if (selection.eq(view3.state.selection))
    return false;
  view3.dispatch(setSel(view3.state, selection));
  return true;
};
var selectByChar = function(view3, forward) {
  return extendSel(view3, (range) => view3.moveByChar(range, forward));
};
var selectByGroup = function(view3, forward) {
  return extendSel(view3, (range) => view3.moveByGroup(range, forward));
};
var selectByLine = function(view3, forward) {
  return extendSel(view3, (range) => view3.moveVertically(range, forward));
};
var selectByPage = function(view3, forward) {
  return extendSel(view3, (range) => view3.moveVertically(range, forward, pageInfo(view3).height));
};
var deleteBy = function(target, by) {
  if (target.state.readOnly)
    return false;
  let event = "delete.selection", { state: state4 } = target;
  let changes = state4.changeByRange((range) => {
    let { from, to } = range;
    if (from == to) {
      let towards = by(from);
      if (towards < from) {
        event = "delete.backward";
        towards = skipAtomic(target, towards, false);
      } else if (towards > from) {
        event = "delete.forward";
        towards = skipAtomic(target, towards, true);
      }
      from = Math.min(from, towards);
      to = Math.max(to, towards);
    } else {
      from = skipAtomic(target, from, false);
      to = skipAtomic(target, to, true);
    }
    return from == to ? { range } : { changes: { from, to }, range: EditorSelection.cursor(from) };
  });
  if (changes.changes.empty)
    return false;
  target.dispatch(state4.update(changes, {
    scrollIntoView: true,
    userEvent: event,
    effects: event == "delete.selection" ? EditorView.announce.of(state4.phrase("Selection deleted")) : undefined
  }));
  return true;
};
var skipAtomic = function(target, pos, forward) {
  if (target instanceof EditorView)
    for (let ranges of target.state.facet(EditorView.atomicRanges).map((f) => f(target)))
      ranges.between(pos, pos, (from, to) => {
        if (from < pos && to > pos)
          pos = forward ? to : from;
      });
  return pos;
};
var selectedLineBlocks = function(state4) {
  let blocks = [], upto = -1;
  for (let range of state4.selection.ranges) {
    let startLine = state4.doc.lineAt(range.from), endLine = state4.doc.lineAt(range.to);
    if (!range.empty && range.to == endLine.from)
      endLine = state4.doc.lineAt(range.to - 1);
    if (upto >= startLine.number) {
      let prev = blocks[blocks.length - 1];
      prev.to = endLine.to;
      prev.ranges.push(range);
    } else {
      blocks.push({ from: startLine.from, to: endLine.to, ranges: [range] });
    }
    upto = endLine.number + 1;
  }
  return blocks;
};
var moveLine = function(state4, dispatch, forward) {
  if (state4.readOnly)
    return false;
  let changes = [], ranges = [];
  for (let block of selectedLineBlocks(state4)) {
    if (forward ? block.to == state4.doc.length : block.from == 0)
      continue;
    let nextLine = state4.doc.lineAt(forward ? block.to + 1 : block.from - 1);
    let size = nextLine.length + 1;
    if (forward) {
      changes.push({ from: block.to, to: nextLine.to }, { from: block.from, insert: nextLine.text + state4.lineBreak });
      for (let r of block.ranges)
        ranges.push(EditorSelection.range(Math.min(state4.doc.length, r.anchor + size), Math.min(state4.doc.length, r.head + size)));
    } else {
      changes.push({ from: nextLine.from, to: block.from }, { from: block.to, insert: state4.lineBreak + nextLine.text });
      for (let r of block.ranges)
        ranges.push(EditorSelection.range(r.anchor - size, r.head - size));
    }
  }
  if (!changes.length)
    return false;
  dispatch(state4.update({
    changes,
    scrollIntoView: true,
    selection: EditorSelection.create(ranges, state4.selection.mainIndex),
    userEvent: "move.line"
  }));
  return true;
};
var copyLine = function(state4, dispatch, forward) {
  if (state4.readOnly)
    return false;
  let changes = [];
  for (let block of selectedLineBlocks(state4)) {
    if (forward)
      changes.push({ from: block.from, insert: state4.doc.slice(block.from, block.to) + state4.lineBreak });
    else
      changes.push({ from: block.to, insert: state4.lineBreak + state4.doc.slice(block.from, block.to) });
  }
  dispatch(state4.update({ changes, scrollIntoView: true, userEvent: "input.copyline" }));
  return true;
};
var isBetweenBrackets = function(state4, pos) {
  if (/\(\)|\[\]|\{\}/.test(state4.sliceDoc(pos - 1, pos + 1)))
    return { from: pos, to: pos };
  let context = syntaxTree(state4).resolveInner(pos);
  let before = context.childBefore(pos), after = context.childAfter(pos), closedBy;
  if (before && after && before.to <= pos && after.from >= pos && (closedBy = before.type.prop(NodeProp.closedBy)) && closedBy.indexOf(after.name) > -1 && state4.doc.lineAt(before.to).from == state4.doc.lineAt(after.from).from && !/\S/.test(state4.sliceDoc(before.to, after.from)))
    return { from: before.to, to: after.from };
  return null;
};
var newlineAndIndent = function(atEof) {
  return ({ state: state4, dispatch }) => {
    if (state4.readOnly)
      return false;
    let changes = state4.changeByRange((range) => {
      let { from, to } = range, line = state4.doc.lineAt(from);
      let explode = !atEof && from == to && isBetweenBrackets(state4, from);
      if (atEof)
        from = to = (to <= line.to ? line : state4.doc.lineAt(to)).to;
      let cx = new IndentContext(state4, { simulateBreak: from, simulateDoubleBreak: !!explode });
      let indent = getIndentation(cx, from);
      if (indent == null)
        indent = countColumn(/^\s*/.exec(state4.doc.lineAt(from).text)[0], state4.tabSize);
      while (to < line.to && /\s/.test(line.text[to - line.from]))
        to++;
      if (explode)
        ({ from, to } = explode);
      else if (from > line.from && from < line.from + 100 && !/\S/.test(line.text.slice(0, from)))
        from = line.from;
      let insert2 = ["", indentString(state4, indent)];
      if (explode)
        insert2.push(indentString(state4, cx.lineIndent(line.from, -1)));
      return {
        changes: { from, to, insert: Text.of(insert2) },
        range: EditorSelection.cursor(from + 1 + insert2[1].length)
      };
    });
    dispatch(state4.update(changes, { scrollIntoView: true, userEvent: "input" }));
    return true;
  };
};
var changeBySelectedLine = function(state4, f) {
  let atLine = -1;
  return state4.changeByRange((range) => {
    let changes = [];
    for (let pos = range.from;pos <= range.to; ) {
      let line = state4.doc.lineAt(pos);
      if (line.number > atLine && (range.empty || range.to > line.from)) {
        f(line, changes, range);
        atLine = line.number;
      }
      pos = line.to + 1;
    }
    let changeSet = state4.changes(changes);
    return {
      changes,
      range: EditorSelection.range(changeSet.mapPos(range.anchor, 1), changeSet.mapPos(range.head, 1))
    };
  });
};
var toggleComment = (target) => {
  let { state: state4 } = target, line = state4.doc.lineAt(state4.selection.main.from), config = getConfig(target.state, line.from);
  return config.line ? toggleLineComment(target) : config.block ? toggleBlockCommentByLine(target) : false;
};
var toggleLineComment = command(changeLineComment, 0);
var toggleBlockComment = command(changeBlockComment, 0);
var toggleBlockCommentByLine = command((o, s) => changeBlockComment(o, s, selectedLineRanges(s)), 0);
var SearchMargin = 50;
var fromHistory = Annotation.define();
var isolateHistory = Annotation.define();
var invertedEffects = Facet.define();
var historyConfig = Facet.define({
  combine(configs) {
    return combineConfig(configs, {
      minDepth: 100,
      newGroupDelay: 500,
      joinToEvent: (_t, isAdjacent2) => isAdjacent2
    }, {
      minDepth: Math.max,
      newGroupDelay: Math.min,
      joinToEvent: (a, b) => (tr, adj) => a(tr, adj) || b(tr, adj)
    });
  }
});
var historyField_ = StateField.define({
  create() {
    return HistoryState.empty;
  },
  update(state4, tr) {
    let config = tr.state.facet(historyConfig);
    let fromHist = tr.annotation(fromHistory);
    if (fromHist) {
      let selection = tr.docChanged ? EditorSelection.single(changeEnd(tr.changes)) : undefined;
      let item = HistEvent.fromTransaction(tr, selection), from = fromHist.side;
      let other = from == 0 ? state4.undone : state4.done;
      if (item)
        other = updateBranch(other, other.length, config.minDepth, item);
      else
        other = addSelection(other, tr.startState.selection);
      return new HistoryState(from == 0 ? fromHist.rest : other, from == 0 ? other : fromHist.rest);
    }
    let isolate = tr.annotation(isolateHistory);
    if (isolate == "full" || isolate == "before")
      state4 = state4.isolate();
    if (tr.annotation(Transaction.addToHistory) === false)
      return !tr.changes.empty ? state4.addMapping(tr.changes.desc) : state4;
    let event = HistEvent.fromTransaction(tr);
    let time = tr.annotation(Transaction.time), userEvent = tr.annotation(Transaction.userEvent);
    if (event)
      state4 = state4.addChanges(event, time, userEvent, config, tr);
    else if (tr.selection)
      state4 = state4.addSelection(tr.startState.selection, time, userEvent, config.newGroupDelay);
    if (isolate == "full" || isolate == "after")
      state4 = state4.isolate();
    return state4;
  },
  toJSON(value) {
    return { done: value.done.map((e) => e.toJSON()), undone: value.undone.map((e) => e.toJSON()) };
  },
  fromJSON(json) {
    return new HistoryState(json.done.map(HistEvent.fromJSON), json.undone.map(HistEvent.fromJSON));
  }
});
var undo = cmd(0, false);
var redo = cmd(1, false);
var undoSelection = cmd(0, true);
var redoSelection = cmd(1, true);
class HistEvent {
  constructor(changes, effects, mapped, startSelection, selectionsAfter) {
    this.changes = changes;
    this.effects = effects;
    this.mapped = mapped;
    this.startSelection = startSelection;
    this.selectionsAfter = selectionsAfter;
  }
  setSelAfter(after) {
    return new HistEvent(this.changes, this.effects, this.mapped, this.startSelection, after);
  }
  toJSON() {
    var _a2, _b, _c;
    return {
      changes: (_a2 = this.changes) === null || _a2 === undefined ? undefined : _a2.toJSON(),
      mapped: (_b = this.mapped) === null || _b === undefined ? undefined : _b.toJSON(),
      startSelection: (_c = this.startSelection) === null || _c === undefined ? undefined : _c.toJSON(),
      selectionsAfter: this.selectionsAfter.map((s) => s.toJSON())
    };
  }
  static fromJSON(json) {
    return new HistEvent(json.changes && ChangeSet.fromJSON(json.changes), [], json.mapped && ChangeDesc.fromJSON(json.mapped), json.startSelection && EditorSelection.fromJSON(json.startSelection), json.selectionsAfter.map(EditorSelection.fromJSON));
  }
  static fromTransaction(tr, selection) {
    let effects = none2;
    for (let invert of tr.startState.facet(invertedEffects)) {
      let result = invert(tr);
      if (result.length)
        effects = effects.concat(result);
    }
    if (!effects.length && tr.changes.empty)
      return null;
    return new HistEvent(tr.changes.invert(tr.startState.doc), effects, undefined, selection || tr.startState.selection, none2);
  }
  static selection(selections) {
    return new HistEvent(undefined, none2, undefined, undefined, selections);
  }
}
var none2 = [];
var MaxSelectionsPerEvent = 200;
var joinableUserEvent = /^(input\.type|delete)($|\.)/;

class HistoryState {
  constructor(done, undone, prevTime = 0, prevUserEvent = undefined) {
    this.done = done;
    this.undone = undone;
    this.prevTime = prevTime;
    this.prevUserEvent = prevUserEvent;
  }
  isolate() {
    return this.prevTime ? new HistoryState(this.done, this.undone) : this;
  }
  addChanges(event, time, userEvent, config, tr) {
    let done = this.done, lastEvent = done[done.length - 1];
    if (lastEvent && lastEvent.changes && !lastEvent.changes.empty && event.changes && (!userEvent || joinableUserEvent.test(userEvent)) && (!lastEvent.selectionsAfter.length && time - this.prevTime < config.newGroupDelay && config.joinToEvent(tr, isAdjacent(lastEvent.changes, event.changes)) || userEvent == "input.type.compose")) {
      done = updateBranch(done, done.length - 1, config.minDepth, new HistEvent(event.changes.compose(lastEvent.changes), conc(event.effects, lastEvent.effects), lastEvent.mapped, lastEvent.startSelection, none2));
    } else {
      done = updateBranch(done, done.length, config.minDepth, event);
    }
    return new HistoryState(done, none2, time, userEvent);
  }
  addSelection(selection, time, userEvent, newGroupDelay) {
    let last = this.done.length ? this.done[this.done.length - 1].selectionsAfter : none2;
    if (last.length > 0 && time - this.prevTime < newGroupDelay && userEvent == this.prevUserEvent && userEvent && /^select($|\.)/.test(userEvent) && eqSelectionShape(last[last.length - 1], selection))
      return this;
    return new HistoryState(addSelection(this.done, selection), this.undone, time, userEvent);
  }
  addMapping(mapping) {
    return new HistoryState(addMappingToBranch(this.done, mapping), addMappingToBranch(this.undone, mapping), this.prevTime, this.prevUserEvent);
  }
  pop(side, state4, selection) {
    let branch = side == 0 ? this.done : this.undone;
    if (branch.length == 0)
      return null;
    let event = branch[branch.length - 1];
    if (selection && event.selectionsAfter.length) {
      return state4.update({
        selection: event.selectionsAfter[event.selectionsAfter.length - 1],
        annotations: fromHistory.of({ side, rest: popSelection(branch) }),
        userEvent: side == 0 ? "select.undo" : "select.redo",
        scrollIntoView: true
      });
    } else if (!event.changes) {
      return null;
    } else {
      let rest = branch.length == 1 ? none2 : branch.slice(0, branch.length - 1);
      if (event.mapped)
        rest = addMappingToBranch(rest, event.mapped);
      return state4.update({
        changes: event.changes,
        selection: event.startSelection,
        effects: event.effects,
        annotations: fromHistory.of({ side, rest }),
        filter: false,
        userEvent: side == 0 ? "undo" : "redo",
        scrollIntoView: true
      });
    }
  }
}
HistoryState.empty = new HistoryState(none2, none2);
var historyKeymap = [
  { key: "Mod-z", run: undo, preventDefault: true },
  { key: "Mod-y", mac: "Mod-Shift-z", run: redo, preventDefault: true },
  { linux: "Ctrl-Shift-z", run: redo, preventDefault: true },
  { key: "Mod-u", run: undoSelection, preventDefault: true },
  { key: "Alt-u", mac: "Mod-Shift-u", run: redoSelection, preventDefault: true }
];
var cursorCharLeft = (view3) => cursorByChar(view3, !ltrAtCursor(view3));
var cursorCharRight = (view3) => cursorByChar(view3, ltrAtCursor(view3));
var cursorGroupLeft = (view3) => cursorByGroup(view3, !ltrAtCursor(view3));
var cursorGroupRight = (view3) => cursorByGroup(view3, ltrAtCursor(view3));
var segmenter = typeof Intl != "undefined" && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: "word" }) : null;
var cursorSyntaxLeft = (view3) => moveSel(view3, (range) => moveBySyntax(view3.state, range, !ltrAtCursor(view3)));
var cursorSyntaxRight = (view3) => moveSel(view3, (range) => moveBySyntax(view3.state, range, ltrAtCursor(view3)));
var cursorLineUp = (view3) => cursorByLine(view3, false);
var cursorLineDown = (view3) => cursorByLine(view3, true);
var cursorPageUp = (view3) => cursorByPage(view3, false);
var cursorPageDown = (view3) => cursorByPage(view3, true);
var cursorLineBoundaryForward = (view3) => moveSel(view3, (range) => moveByLineBoundary(view3, range, true));
var cursorLineBoundaryBackward = (view3) => moveSel(view3, (range) => moveByLineBoundary(view3, range, false));
var cursorLineBoundaryLeft = (view3) => moveSel(view3, (range) => moveByLineBoundary(view3, range, !ltrAtCursor(view3)));
var cursorLineBoundaryRight = (view3) => moveSel(view3, (range) => moveByLineBoundary(view3, range, ltrAtCursor(view3)));
var cursorLineStart = (view3) => moveSel(view3, (range) => EditorSelection.cursor(view3.lineBlockAt(range.head).from, 1));
var cursorLineEnd = (view3) => moveSel(view3, (range) => EditorSelection.cursor(view3.lineBlockAt(range.head).to, -1));
var cursorMatchingBracket = ({ state: state4, dispatch }) => toMatchingBracket(state4, dispatch, false);
var selectCharLeft = (view3) => selectByChar(view3, !ltrAtCursor(view3));
var selectCharRight = (view3) => selectByChar(view3, ltrAtCursor(view3));
var selectGroupLeft = (view3) => selectByGroup(view3, !ltrAtCursor(view3));
var selectGroupRight = (view3) => selectByGroup(view3, ltrAtCursor(view3));
var selectSyntaxLeft = (view3) => extendSel(view3, (range) => moveBySyntax(view3.state, range, !ltrAtCursor(view3)));
var selectSyntaxRight = (view3) => extendSel(view3, (range) => moveBySyntax(view3.state, range, ltrAtCursor(view3)));
var selectLineUp = (view3) => selectByLine(view3, false);
var selectLineDown = (view3) => selectByLine(view3, true);
var selectPageUp = (view3) => selectByPage(view3, false);
var selectPageDown = (view3) => selectByPage(view3, true);
var selectLineBoundaryForward = (view3) => extendSel(view3, (range) => moveByLineBoundary(view3, range, true));
var selectLineBoundaryBackward = (view3) => extendSel(view3, (range) => moveByLineBoundary(view3, range, false));
var selectLineBoundaryLeft = (view3) => extendSel(view3, (range) => moveByLineBoundary(view3, range, !ltrAtCursor(view3)));
var selectLineBoundaryRight = (view3) => extendSel(view3, (range) => moveByLineBoundary(view3, range, ltrAtCursor(view3)));
var selectLineStart = (view3) => extendSel(view3, (range) => EditorSelection.cursor(view3.lineBlockAt(range.head).from));
var selectLineEnd = (view3) => extendSel(view3, (range) => EditorSelection.cursor(view3.lineBlockAt(range.head).to));
var cursorDocStart = ({ state: state4, dispatch }) => {
  dispatch(setSel(state4, { anchor: 0 }));
  return true;
};
var cursorDocEnd = ({ state: state4, dispatch }) => {
  dispatch(setSel(state4, { anchor: state4.doc.length }));
  return true;
};
var selectDocStart = ({ state: state4, dispatch }) => {
  dispatch(setSel(state4, { anchor: state4.selection.main.anchor, head: 0 }));
  return true;
};
var selectDocEnd = ({ state: state4, dispatch }) => {
  dispatch(setSel(state4, { anchor: state4.selection.main.anchor, head: state4.doc.length }));
  return true;
};
var selectAll = ({ state: state4, dispatch }) => {
  dispatch(state4.update({ selection: { anchor: 0, head: state4.doc.length }, userEvent: "select" }));
  return true;
};
var selectLine = ({ state: state4, dispatch }) => {
  let ranges = selectedLineBlocks(state4).map(({ from, to }) => EditorSelection.range(from, Math.min(to + 1, state4.doc.length)));
  dispatch(state4.update({ selection: EditorSelection.create(ranges), userEvent: "select" }));
  return true;
};
var selectParentSyntax = ({ state: state4, dispatch }) => {
  let selection = updateSel(state4.selection, (range) => {
    var _a2;
    let context = syntaxTree(state4).resolveInner(range.head, 1);
    while (!(context.from < range.from && context.to >= range.to || context.to > range.to && context.from <= range.from || !((_a2 = context.parent) === null || _a2 === undefined ? undefined : _a2.parent)))
      context = context.parent;
    return EditorSelection.range(context.to, context.from);
  });
  dispatch(setSel(state4, selection));
  return true;
};
var simplifySelection = ({ state: state4, dispatch }) => {
  let cur = state4.selection, selection = null;
  if (cur.ranges.length > 1)
    selection = EditorSelection.create([cur.main]);
  else if (!cur.main.empty)
    selection = EditorSelection.create([EditorSelection.cursor(cur.main.head)]);
  if (!selection)
    return false;
  dispatch(setSel(state4, selection));
  return true;
};
var deleteByChar = (target, forward) => deleteBy(target, (pos) => {
  let { state: state4 } = target, line = state4.doc.lineAt(pos), before, targetPos;
  if (!forward && pos > line.from && pos < line.from + 200 && !/[^ \t]/.test(before = line.text.slice(0, pos - line.from))) {
    if (before[before.length - 1] == "\t")
      return pos - 1;
    let col = countColumn(before, state4.tabSize), drop = col % getIndentUnit(state4) || getIndentUnit(state4);
    for (let i = 0;i < drop && before[before.length - 1 - i] == " "; i++)
      pos--;
    targetPos = pos;
  } else {
    targetPos = findClusterBreak(line.text, pos - line.from, forward, forward) + line.from;
    if (targetPos == pos && line.number != (forward ? state4.doc.lines : 1))
      targetPos += forward ? 1 : -1;
  }
  return targetPos;
});
var deleteCharBackward = (view3) => deleteByChar(view3, false);
var deleteCharForward = (view3) => deleteByChar(view3, true);
var deleteByGroup = (target, forward) => deleteBy(target, (start) => {
  let pos = start, { state: state4 } = target, line = state4.doc.lineAt(pos);
  let categorize = state4.charCategorizer(pos);
  for (let cat = null;; ) {
    if (pos == (forward ? line.to : line.from)) {
      if (pos == start && line.number != (forward ? state4.doc.lines : 1))
        pos += forward ? 1 : -1;
      break;
    }
    let next = findClusterBreak(line.text, pos - line.from, forward) + line.from;
    let nextChar = line.text.slice(Math.min(pos, next) - line.from, Math.max(pos, next) - line.from);
    let nextCat = categorize(nextChar);
    if (cat != null && nextCat != cat)
      break;
    if (nextChar != " " || pos != start)
      cat = nextCat;
    pos = next;
  }
  return pos;
});
var deleteGroupBackward = (target) => deleteByGroup(target, false);
var deleteGroupForward = (target) => deleteByGroup(target, true);
var deleteToLineEnd = (view3) => deleteBy(view3, (pos) => {
  let lineEnd = view3.lineBlockAt(pos).to;
  return pos < lineEnd ? lineEnd : Math.min(view3.state.doc.length, pos + 1);
});
var deleteToLineStart = (view3) => deleteBy(view3, (pos) => {
  let lineStart = view3.lineBlockAt(pos).from;
  return pos > lineStart ? lineStart : Math.max(0, pos - 1);
});
var splitLine = ({ state: state4, dispatch }) => {
  if (state4.readOnly)
    return false;
  let changes = state4.changeByRange((range) => {
    return {
      changes: { from: range.from, to: range.to, insert: Text.of(["", ""]) },
      range: EditorSelection.cursor(range.from)
    };
  });
  dispatch(state4.update(changes, { scrollIntoView: true, userEvent: "input" }));
  return true;
};
var transposeChars = ({ state: state4, dispatch }) => {
  if (state4.readOnly)
    return false;
  let changes = state4.changeByRange((range) => {
    if (!range.empty || range.from == 0 || range.from == state4.doc.length)
      return { range };
    let pos = range.from, line = state4.doc.lineAt(pos);
    let from = pos == line.from ? pos - 1 : findClusterBreak(line.text, pos - line.from, false) + line.from;
    let to = pos == line.to ? pos + 1 : findClusterBreak(line.text, pos - line.from, true) + line.from;
    return {
      changes: { from, to, insert: state4.doc.slice(pos, to).append(state4.doc.slice(from, pos)) },
      range: EditorSelection.cursor(to)
    };
  });
  if (changes.changes.empty)
    return false;
  dispatch(state4.update(changes, { scrollIntoView: true, userEvent: "move.character" }));
  return true;
};
var moveLineUp = ({ state: state4, dispatch }) => moveLine(state4, dispatch, false);
var moveLineDown = ({ state: state4, dispatch }) => moveLine(state4, dispatch, true);
var copyLineUp = ({ state: state4, dispatch }) => copyLine(state4, dispatch, false);
var copyLineDown = ({ state: state4, dispatch }) => copyLine(state4, dispatch, true);
var deleteLine = (view3) => {
  if (view3.state.readOnly)
    return false;
  let { state: state4 } = view3, changes = state4.changes(selectedLineBlocks(state4).map(({ from, to }) => {
    if (from > 0)
      from--;
    else if (to < state4.doc.length)
      to++;
    return { from, to };
  }));
  let selection = updateSel(state4.selection, (range) => view3.moveVertically(range, true)).map(changes);
  view3.dispatch({ changes, selection, scrollIntoView: true, userEvent: "delete.line" });
  return true;
};
var insertNewlineAndIndent = newlineAndIndent(false);
var insertBlankLine = newlineAndIndent(true);
var indentSelection = ({ state: state4, dispatch }) => {
  if (state4.readOnly)
    return false;
  let updated = Object.create(null);
  let context = new IndentContext(state4, { overrideIndentation: (start) => {
    let found = updated[start];
    return found == null ? -1 : found;
  } });
  let changes = changeBySelectedLine(state4, (line, changes2, range) => {
    let indent = getIndentation(context, line.from);
    if (indent == null)
      return;
    if (!/\S/.test(line.text))
      indent = 0;
    let cur = /^\s*/.exec(line.text)[0];
    let norm = indentString(state4, indent);
    if (cur != norm || range.from < line.from + cur.length) {
      updated[line.from] = indent;
      changes2.push({ from: line.from, to: line.from + cur.length, insert: norm });
    }
  });
  if (!changes.changes.empty)
    dispatch(state4.update(changes, { userEvent: "indent" }));
  return true;
};
var indentMore = ({ state: state4, dispatch }) => {
  if (state4.readOnly)
    return false;
  dispatch(state4.update(changeBySelectedLine(state4, (line, changes) => {
    changes.push({ from: line.from, insert: state4.facet(indentUnit) });
  }), { userEvent: "input.indent" }));
  return true;
};
var indentLess = ({ state: state4, dispatch }) => {
  if (state4.readOnly)
    return false;
  dispatch(state4.update(changeBySelectedLine(state4, (line, changes) => {
    let space = /^\s*/.exec(line.text)[0];
    if (!space)
      return;
    let col = countColumn(space, state4.tabSize), keep = 0;
    let insert2 = indentString(state4, Math.max(0, col - getIndentUnit(state4)));
    while (keep < space.length && keep < insert2.length && space.charCodeAt(keep) == insert2.charCodeAt(keep))
      keep++;
    changes.push({ from: line.from + keep, to: line.from + space.length, insert: insert2.slice(keep) });
  }), { userEvent: "delete.dedent" }));
  return true;
};
var emacsStyleKeymap = [
  { key: "Ctrl-b", run: cursorCharLeft, shift: selectCharLeft, preventDefault: true },
  { key: "Ctrl-f", run: cursorCharRight, shift: selectCharRight },
  { key: "Ctrl-p", run: cursorLineUp, shift: selectLineUp },
  { key: "Ctrl-n", run: cursorLineDown, shift: selectLineDown },
  { key: "Ctrl-a", run: cursorLineStart, shift: selectLineStart },
  { key: "Ctrl-e", run: cursorLineEnd, shift: selectLineEnd },
  { key: "Ctrl-d", run: deleteCharForward },
  { key: "Ctrl-h", run: deleteCharBackward },
  { key: "Ctrl-k", run: deleteToLineEnd },
  { key: "Ctrl-Alt-h", run: deleteGroupBackward },
  { key: "Ctrl-o", run: splitLine },
  { key: "Ctrl-t", run: transposeChars },
  { key: "Ctrl-v", run: cursorPageDown }
];
var standardKeymap = [
  { key: "ArrowLeft", run: cursorCharLeft, shift: selectCharLeft, preventDefault: true },
  { key: "Mod-ArrowLeft", mac: "Alt-ArrowLeft", run: cursorGroupLeft, shift: selectGroupLeft, preventDefault: true },
  { mac: "Cmd-ArrowLeft", run: cursorLineBoundaryLeft, shift: selectLineBoundaryLeft, preventDefault: true },
  { key: "ArrowRight", run: cursorCharRight, shift: selectCharRight, preventDefault: true },
  { key: "Mod-ArrowRight", mac: "Alt-ArrowRight", run: cursorGroupRight, shift: selectGroupRight, preventDefault: true },
  { mac: "Cmd-ArrowRight", run: cursorLineBoundaryRight, shift: selectLineBoundaryRight, preventDefault: true },
  { key: "ArrowUp", run: cursorLineUp, shift: selectLineUp, preventDefault: true },
  { mac: "Cmd-ArrowUp", run: cursorDocStart, shift: selectDocStart },
  { mac: "Ctrl-ArrowUp", run: cursorPageUp, shift: selectPageUp },
  { key: "ArrowDown", run: cursorLineDown, shift: selectLineDown, preventDefault: true },
  { mac: "Cmd-ArrowDown", run: cursorDocEnd, shift: selectDocEnd },
  { mac: "Ctrl-ArrowDown", run: cursorPageDown, shift: selectPageDown },
  { key: "PageUp", run: cursorPageUp, shift: selectPageUp },
  { key: "PageDown", run: cursorPageDown, shift: selectPageDown },
  { key: "Home", run: cursorLineBoundaryBackward, shift: selectLineBoundaryBackward, preventDefault: true },
  { key: "Mod-Home", run: cursorDocStart, shift: selectDocStart },
  { key: "End", run: cursorLineBoundaryForward, shift: selectLineBoundaryForward, preventDefault: true },
  { key: "Mod-End", run: cursorDocEnd, shift: selectDocEnd },
  { key: "Enter", run: insertNewlineAndIndent },
  { key: "Mod-a", run: selectAll },
  { key: "Backspace", run: deleteCharBackward, shift: deleteCharBackward },
  { key: "Delete", run: deleteCharForward },
  { key: "Mod-Backspace", mac: "Alt-Backspace", run: deleteGroupBackward },
  { key: "Mod-Delete", mac: "Alt-Delete", run: deleteGroupForward },
  { mac: "Mod-Backspace", run: deleteToLineStart },
  { mac: "Mod-Delete", run: deleteToLineEnd }
].concat(emacsStyleKeymap.map((b) => ({ mac: b.key, run: b.run, shift: b.shift })));
var defaultKeymap = [
  { key: "Alt-ArrowLeft", mac: "Ctrl-ArrowLeft", run: cursorSyntaxLeft, shift: selectSyntaxLeft },
  { key: "Alt-ArrowRight", mac: "Ctrl-ArrowRight", run: cursorSyntaxRight, shift: selectSyntaxRight },
  { key: "Alt-ArrowUp", run: moveLineUp },
  { key: "Shift-Alt-ArrowUp", run: copyLineUp },
  { key: "Alt-ArrowDown", run: moveLineDown },
  { key: "Shift-Alt-ArrowDown", run: copyLineDown },
  { key: "Escape", run: simplifySelection },
  { key: "Mod-Enter", run: insertBlankLine },
  { key: "Alt-l", mac: "Ctrl-l", run: selectLine },
  { key: "Mod-i", run: selectParentSyntax, preventDefault: true },
  { key: "Mod-[", run: indentLess },
  { key: "Mod-]", run: indentMore },
  { key: "Mod-Alt-\\", run: indentSelection },
  { key: "Shift-Mod-k", run: deleteLine },
  { key: "Shift-Mod-\\", run: cursorMatchingBracket },
  { key: "Mod-/", run: toggleComment },
  { key: "Alt-A", run: toggleBlockComment }
].concat(standardKeymap);
var indentWithTab = { key: "Tab", run: indentMore, shift: indentLess };

// /home/ray/Code/diagramatics-site/node_modules/crelt/index.js
var add = function(elt, child) {
  if (typeof child == "string") {
    elt.appendChild(document.createTextNode(child));
  } else if (child == null) {
  } else if (child.nodeType != null) {
    elt.appendChild(child);
  } else if (Array.isArray(child)) {
    for (var i = 0;i < child.length; i++)
      add(elt, child[i]);
  } else {
    throw new RangeError("Unsupported child node: " + child);
  }
};
function crelt() {
  var elt = arguments[0];
  if (typeof elt == "string")
    elt = document.createElement(elt);
  var i = 1, next = arguments[1];
  if (next && typeof next == "object" && next.nodeType == null && !Array.isArray(next)) {
    for (var name2 in next)
      if (Object.prototype.hasOwnProperty.call(next, name2)) {
        var value = next[name2];
        if (typeof value == "string")
          elt.setAttribute(name2, value);
        else if (value != null)
          elt[name2] = value;
      }
    i++;
  }
  for (;i < arguments.length; i++)
    add(elt, arguments[i]);
  return elt;
}

// /home/ray/Code/diagramatics-site/node_modules/@codemirror/search/dist/index.js
var validRegExp = function(source) {
  try {
    new RegExp(source, baseFlags);
    return true;
  } catch (_a2) {
    return false;
  }
};
var toCharEnd = function(text, pos) {
  if (pos >= text.length)
    return pos;
  let line = text.lineAt(pos), next;
  while (pos < line.to && (next = line.text.charCodeAt(pos - line.from)) >= 56320 && next < 57344)
    pos++;
  return pos;
};
var createLineDialog = function(view4) {
  let input = crelt("input", { class: "cm-textfield", name: "line" });
  let dom = crelt("form", {
    class: "cm-gotoLine",
    onkeydown: (event) => {
      if (event.keyCode == 27) {
        event.preventDefault();
        view4.dispatch({ effects: dialogEffect.of(false) });
        view4.focus();
      } else if (event.keyCode == 13) {
        event.preventDefault();
        go();
      }
    },
    onsubmit: (event) => {
      event.preventDefault();
      go();
    }
  }, crelt("label", view4.state.phrase("Go to line"), ": ", input), " ", crelt("button", { class: "cm-button", type: "submit" }, view4.state.phrase("go")));
  function go() {
    let match = /^([+-])?(\d+)?(:\d+)?(%)?$/.exec(input.value);
    if (!match)
      return;
    let { state: state5 } = view4, startLine = state5.doc.lineAt(state5.selection.main.head);
    let [, sign, ln, cl, percent] = match;
    let col = cl ? +cl.slice(1) : 0;
    let line = ln ? +ln : startLine.number;
    if (ln && percent) {
      let pc = line / 100;
      if (sign)
        pc = pc * (sign == "-" ? -1 : 1) + startLine.number / state5.doc.lines;
      line = Math.round(state5.doc.lines * pc);
    } else if (ln && sign) {
      line = line * (sign == "-" ? -1 : 1) + startLine.number;
    }
    let docLine = state5.doc.line(Math.max(1, Math.min(state5.doc.lines, line)));
    let selection = EditorSelection.cursor(docLine.from + Math.max(0, Math.min(col, docLine.length)));
    view4.dispatch({
      effects: [dialogEffect.of(false), EditorView.scrollIntoView(selection.from, { y: "center" })],
      selection
    });
    view4.focus();
  }
  return { dom };
};
var highlightSelectionMatches = function(options) {
  let ext = [defaultTheme, matchHighlighter];
  if (options)
    ext.push(highlightConfig.of(options));
  return ext;
};
var insideWordBoundaries = function(check, state5, from, to) {
  return (from == 0 || check(state5.sliceDoc(from - 1, from)) != CharCategory.Word) && (to == state5.doc.length || check(state5.sliceDoc(to, to + 1)) != CharCategory.Word);
};
var insideWord = function(check, state5, from, to) {
  return check(state5.sliceDoc(from, from + 1)) == CharCategory.Word && check(state5.sliceDoc(to - 1, to)) == CharCategory.Word;
};
var findNextOccurrence = function(state5, query) {
  let { main, ranges } = state5.selection;
  let word = state5.wordAt(main.head), fullWord = word && word.from == main.from && word.to == main.to;
  for (let cycled = false, cursor = new SearchCursor(state5.doc, query, ranges[ranges.length - 1].to);; ) {
    cursor.next();
    if (cursor.done) {
      if (cycled)
        return null;
      cursor = new SearchCursor(state5.doc, query, 0, Math.max(0, ranges[ranges.length - 1].from - 1));
      cycled = true;
    } else {
      if (cycled && ranges.some((r) => r.from == cursor.value.from))
        continue;
      if (fullWord) {
        let word2 = state5.wordAt(cursor.value.from);
        if (!word2 || word2.from != cursor.value.from || word2.to != cursor.value.to)
          continue;
      }
      return cursor.value;
    }
  }
};
var stringCursor = function(spec, state5, from, to) {
  return new SearchCursor(state5.doc, spec.unquoted, from, to, spec.caseSensitive ? undefined : (x) => x.toLowerCase(), spec.wholeWord ? stringWordTest(state5.doc, state5.charCategorizer(state5.selection.main.head)) : undefined);
};
var stringWordTest = function(doc2, categorizer) {
  return (from, to, buf, bufPos) => {
    if (bufPos > from || bufPos + buf.length < to) {
      bufPos = Math.max(0, from - 2);
      buf = doc2.sliceString(bufPos, Math.min(doc2.length, to + 2));
    }
    return (categorizer(charBefore(buf, from - bufPos)) != CharCategory.Word || categorizer(charAfter(buf, from - bufPos)) != CharCategory.Word) && (categorizer(charAfter(buf, to - bufPos)) != CharCategory.Word || categorizer(charBefore(buf, to - bufPos)) != CharCategory.Word);
  };
};
var regexpCursor = function(spec, state5, from, to) {
  return new RegExpCursor(state5.doc, spec.search, {
    ignoreCase: !spec.caseSensitive,
    test: spec.wholeWord ? regexpWordTest(state5.charCategorizer(state5.selection.main.head)) : undefined
  }, from, to);
};
var charBefore = function(str, index) {
  return str.slice(findClusterBreak(str, index, false), index);
};
var charAfter = function(str, index) {
  return str.slice(index, findClusterBreak(str, index));
};
var regexpWordTest = function(categorizer) {
  return (_from, _to, match) => !match[0].length || (categorizer(charBefore(match.input, match.index)) != CharCategory.Word || categorizer(charAfter(match.input, match.index)) != CharCategory.Word) && (categorizer(charAfter(match.input, match.index + match[0].length)) != CharCategory.Word || categorizer(charBefore(match.input, match.index + match[0].length)) != CharCategory.Word);
};
var searchCommand = function(f) {
  return (view4) => {
    let state5 = view4.state.field(searchState, false);
    return state5 && state5.query.spec.valid ? f(view4, state5) : openSearchPanel(view4);
  };
};
var createSearchPanel = function(view4) {
  return view4.state.facet(searchConfigFacet).createPanel(view4);
};
var defaultQuery = function(state5, fallback) {
  var _a2, _b, _c, _d, _e;
  let sel = state5.selection.main;
  let selText = sel.empty || sel.to > sel.from + 100 ? "" : state5.sliceDoc(sel.from, sel.to);
  if (fallback && !selText)
    return fallback;
  let config = state5.facet(searchConfigFacet);
  return new SearchQuery({
    search: ((_a2 = fallback === null || fallback === undefined ? undefined : fallback.literal) !== null && _a2 !== undefined ? _a2 : config.literal) ? selText : selText.replace(/\n/g, "\\n"),
    caseSensitive: (_b = fallback === null || fallback === undefined ? undefined : fallback.caseSensitive) !== null && _b !== undefined ? _b : config.caseSensitive,
    literal: (_c = fallback === null || fallback === undefined ? undefined : fallback.literal) !== null && _c !== undefined ? _c : config.literal,
    regexp: (_d = fallback === null || fallback === undefined ? undefined : fallback.regexp) !== null && _d !== undefined ? _d : config.regexp,
    wholeWord: (_e = fallback === null || fallback === undefined ? undefined : fallback.wholeWord) !== null && _e !== undefined ? _e : config.wholeWord
  });
};
var getSearchInput = function(view4) {
  let panel = getPanel(view4, createSearchPanel);
  return panel && panel.dom.querySelector("[main-field]");
};
var selectSearchInput = function(view4) {
  let input = getSearchInput(view4);
  if (input && input == view4.root.activeElement)
    input.select();
};
var phrase = function(view4, phrase2) {
  return view4.state.phrase(phrase2);
};
var announceMatch = function(view4, { from, to }) {
  let line = view4.state.doc.lineAt(from), lineEnd = view4.state.doc.lineAt(to).to;
  let start = Math.max(line.from, from - AnnounceMargin), end = Math.min(lineEnd, to + AnnounceMargin);
  let text = view4.state.sliceDoc(start, end);
  if (start != line.from) {
    for (let i = 0;i < AnnounceMargin; i++)
      if (!Break.test(text[i + 1]) && Break.test(text[i])) {
        text = text.slice(i);
        break;
      }
  }
  if (end != lineEnd) {
    for (let i = text.length - 1;i > text.length - AnnounceMargin; i--)
      if (!Break.test(text[i - 1]) && Break.test(text[i])) {
        text = text.slice(0, i);
        break;
      }
  }
  return EditorView.announce.of(`${view4.state.phrase("current match")}. ${text} ${view4.state.phrase("on line")} ${line.number}.`);
};
var basicNormalize = typeof String.prototype.normalize == "function" ? (x) => x.normalize("NFKD") : (x) => x;

class SearchCursor {
  constructor(text, query, from = 0, to = text.length, normalize, test) {
    this.test = test;
    this.value = { from: 0, to: 0 };
    this.done = false;
    this.matches = [];
    this.buffer = "";
    this.bufferPos = 0;
    this.iter = text.iterRange(from, to);
    this.bufferStart = from;
    this.normalize = normalize ? (x) => normalize(basicNormalize(x)) : basicNormalize;
    this.query = this.normalize(query);
  }
  peek() {
    if (this.bufferPos == this.buffer.length) {
      this.bufferStart += this.buffer.length;
      this.iter.next();
      if (this.iter.done)
        return -1;
      this.bufferPos = 0;
      this.buffer = this.iter.value;
    }
    return codePointAt(this.buffer, this.bufferPos);
  }
  next() {
    while (this.matches.length)
      this.matches.pop();
    return this.nextOverlapping();
  }
  nextOverlapping() {
    for (;; ) {
      let next = this.peek();
      if (next < 0) {
        this.done = true;
        return this;
      }
      let str = fromCodePoint(next), start = this.bufferStart + this.bufferPos;
      this.bufferPos += codePointSize(next);
      let norm = this.normalize(str);
      for (let i = 0, pos = start;; i++) {
        let code = norm.charCodeAt(i);
        let match = this.match(code, pos);
        if (i == norm.length - 1) {
          if (match) {
            this.value = match;
            return this;
          }
          break;
        }
        if (pos == start && i < str.length && str.charCodeAt(i) == code)
          pos++;
      }
    }
  }
  match(code, pos) {
    let match = null;
    for (let i = 0;i < this.matches.length; i += 2) {
      let index = this.matches[i], keep = false;
      if (this.query.charCodeAt(index) == code) {
        if (index == this.query.length - 1) {
          match = { from: this.matches[i + 1], to: pos + 1 };
        } else {
          this.matches[i]++;
          keep = true;
        }
      }
      if (!keep) {
        this.matches.splice(i, 2);
        i -= 2;
      }
    }
    if (this.query.charCodeAt(0) == code) {
      if (this.query.length == 1)
        match = { from: pos, to: pos + 1 };
      else
        this.matches.push(1, pos);
    }
    if (match && this.test && !this.test(match.from, match.to, this.buffer, this.bufferPos))
      match = null;
    return match;
  }
}
if (typeof Symbol != "undefined")
  SearchCursor.prototype[Symbol.iterator] = function() {
    return this;
  };
var empty = { from: -1, to: -1, match: /.*/.exec("") };
var baseFlags = "gm" + (/x/.unicode == null ? "" : "u");

class RegExpCursor {
  constructor(text, query, options, from = 0, to = text.length) {
    this.text = text;
    this.to = to;
    this.curLine = "";
    this.done = false;
    this.value = empty;
    if (/\\[sWDnr]|\n|\r|\[\^/.test(query))
      return new MultilineRegExpCursor(text, query, options, from, to);
    this.re = new RegExp(query, baseFlags + ((options === null || options === undefined ? undefined : options.ignoreCase) ? "i" : ""));
    this.test = options === null || options === undefined ? undefined : options.test;
    this.iter = text.iter();
    let startLine = text.lineAt(from);
    this.curLineStart = startLine.from;
    this.matchPos = toCharEnd(text, from);
    this.getLine(this.curLineStart);
  }
  getLine(skip) {
    this.iter.next(skip);
    if (this.iter.lineBreak) {
      this.curLine = "";
    } else {
      this.curLine = this.iter.value;
      if (this.curLineStart + this.curLine.length > this.to)
        this.curLine = this.curLine.slice(0, this.to - this.curLineStart);
      this.iter.next();
    }
  }
  nextLine() {
    this.curLineStart = this.curLineStart + this.curLine.length + 1;
    if (this.curLineStart > this.to)
      this.curLine = "";
    else
      this.getLine(0);
  }
  next() {
    for (let off = this.matchPos - this.curLineStart;; ) {
      this.re.lastIndex = off;
      let match = this.matchPos <= this.to && this.re.exec(this.curLine);
      if (match) {
        let from = this.curLineStart + match.index, to = from + match[0].length;
        this.matchPos = toCharEnd(this.text, to + (from == to ? 1 : 0));
        if (from == this.curLineStart + this.curLine.length)
          this.nextLine();
        if ((from < to || from > this.value.to) && (!this.test || this.test(from, to, match))) {
          this.value = { from, to, match };
          return this;
        }
        off = this.matchPos - this.curLineStart;
      } else if (this.curLineStart + this.curLine.length < this.to) {
        this.nextLine();
        off = 0;
      } else {
        this.done = true;
        return this;
      }
    }
  }
}
var flattened = new WeakMap;

class FlattenedDoc {
  constructor(from, text) {
    this.from = from;
    this.text = text;
  }
  get to() {
    return this.from + this.text.length;
  }
  static get(doc2, from, to) {
    let cached = flattened.get(doc2);
    if (!cached || cached.from >= to || cached.to <= from) {
      let flat = new FlattenedDoc(from, doc2.sliceString(from, to));
      flattened.set(doc2, flat);
      return flat;
    }
    if (cached.from == from && cached.to == to)
      return cached;
    let { text, from: cachedFrom } = cached;
    if (cachedFrom > from) {
      text = doc2.sliceString(from, cachedFrom) + text;
      cachedFrom = from;
    }
    if (cached.to < to)
      text += doc2.sliceString(cached.to, to);
    flattened.set(doc2, new FlattenedDoc(cachedFrom, text));
    return new FlattenedDoc(from, text.slice(from - cachedFrom, to - cachedFrom));
  }
}

class MultilineRegExpCursor {
  constructor(text, query, options, from, to) {
    this.text = text;
    this.to = to;
    this.done = false;
    this.value = empty;
    this.matchPos = toCharEnd(text, from);
    this.re = new RegExp(query, baseFlags + ((options === null || options === undefined ? undefined : options.ignoreCase) ? "i" : ""));
    this.test = options === null || options === undefined ? undefined : options.test;
    this.flat = FlattenedDoc.get(text, from, this.chunkEnd(from + 5000));
  }
  chunkEnd(pos) {
    return pos >= this.to ? this.to : this.text.lineAt(pos).to;
  }
  next() {
    for (;; ) {
      let off = this.re.lastIndex = this.matchPos - this.flat.from;
      let match = this.re.exec(this.flat.text);
      if (match && !match[0] && match.index == off) {
        this.re.lastIndex = off + 1;
        match = this.re.exec(this.flat.text);
      }
      if (match) {
        let from = this.flat.from + match.index, to = from + match[0].length;
        if ((this.flat.to >= this.to || match.index + match[0].length <= this.flat.text.length - 10) && (!this.test || this.test(from, to, match))) {
          this.value = { from, to, match };
          this.matchPos = toCharEnd(this.text, to + (from == to ? 1 : 0));
          return this;
        }
      }
      if (this.flat.to == this.to) {
        this.done = true;
        return this;
      }
      this.flat = FlattenedDoc.get(this.text, this.flat.from, this.chunkEnd(this.flat.from + this.flat.text.length * 2));
    }
  }
}
if (typeof Symbol != "undefined") {
  RegExpCursor.prototype[Symbol.iterator] = MultilineRegExpCursor.prototype[Symbol.iterator] = function() {
    return this;
  };
}
var dialogEffect = StateEffect.define();
var dialogField = StateField.define({
  create() {
    return true;
  },
  update(value, tr) {
    for (let e of tr.effects)
      if (e.is(dialogEffect))
        value = e.value;
    return value;
  },
  provide: (f) => showPanel.from(f, (val) => val ? createLineDialog : null)
});
var gotoLine = (view4) => {
  let panel = getPanel(view4, createLineDialog);
  if (!panel) {
    let effects = [dialogEffect.of(true)];
    if (view4.state.field(dialogField, false) == null)
      effects.push(StateEffect.appendConfig.of([dialogField, baseTheme$13]));
    view4.dispatch({ effects });
    panel = getPanel(view4, createLineDialog);
  }
  if (panel)
    panel.dom.querySelector("input").focus();
  return true;
};
var baseTheme$13 = EditorView.baseTheme({
  ".cm-panel.cm-gotoLine": {
    padding: "2px 6px 4px",
    "& label": { fontSize: "80%" }
  }
});
var defaultHighlightOptions = {
  highlightWordAroundCursor: false,
  minSelectionLength: 1,
  maxMatches: 100,
  wholeWords: false
};
var highlightConfig = Facet.define({
  combine(options) {
    return combineConfig(options, defaultHighlightOptions, {
      highlightWordAroundCursor: (a, b) => a || b,
      minSelectionLength: Math.min,
      maxMatches: Math.min
    });
  }
});
var matchDeco = Decoration.mark({ class: "cm-selectionMatch" });
var mainMatchDeco = Decoration.mark({ class: "cm-selectionMatch cm-selectionMatch-main" });
var matchHighlighter = ViewPlugin.fromClass(class {
  constructor(view4) {
    this.decorations = this.getDeco(view4);
  }
  update(update) {
    if (update.selectionSet || update.docChanged || update.viewportChanged)
      this.decorations = this.getDeco(update.view);
  }
  getDeco(view4) {
    let conf = view4.state.facet(highlightConfig);
    let { state: state5 } = view4, sel = state5.selection;
    if (sel.ranges.length > 1)
      return Decoration.none;
    let range = sel.main, query, check = null;
    if (range.empty) {
      if (!conf.highlightWordAroundCursor)
        return Decoration.none;
      let word = state5.wordAt(range.head);
      if (!word)
        return Decoration.none;
      check = state5.charCategorizer(range.head);
      query = state5.sliceDoc(word.from, word.to);
    } else {
      let len = range.to - range.from;
      if (len < conf.minSelectionLength || len > 200)
        return Decoration.none;
      if (conf.wholeWords) {
        query = state5.sliceDoc(range.from, range.to);
        check = state5.charCategorizer(range.head);
        if (!(insideWordBoundaries(check, state5, range.from, range.to) && insideWord(check, state5, range.from, range.to)))
          return Decoration.none;
      } else {
        query = state5.sliceDoc(range.from, range.to).trim();
        if (!query)
          return Decoration.none;
      }
    }
    let deco = [];
    for (let part of view4.visibleRanges) {
      let cursor = new SearchCursor(state5.doc, query, part.from, part.to);
      while (!cursor.next().done) {
        let { from, to } = cursor.value;
        if (!check || insideWordBoundaries(check, state5, from, to)) {
          if (range.empty && from <= range.from && to >= range.to)
            deco.push(mainMatchDeco.range(from, to));
          else if (from >= range.to || to <= range.from)
            deco.push(matchDeco.range(from, to));
          if (deco.length > conf.maxMatches)
            return Decoration.none;
        }
      }
    }
    return Decoration.set(deco);
  }
}, {
  decorations: (v) => v.decorations
});
var defaultTheme = EditorView.baseTheme({
  ".cm-selectionMatch": { backgroundColor: "#99ff7780" },
  ".cm-searchMatch .cm-selectionMatch": { backgroundColor: "transparent" }
});
var selectWord = ({ state: state5, dispatch }) => {
  let { selection } = state5;
  let newSel = EditorSelection.create(selection.ranges.map((range) => state5.wordAt(range.head) || EditorSelection.cursor(range.head)), selection.mainIndex);
  if (newSel.eq(selection))
    return false;
  dispatch(state5.update({ selection: newSel }));
  return true;
};
var selectNextOccurrence = ({ state: state5, dispatch }) => {
  let { ranges } = state5.selection;
  if (ranges.some((sel) => sel.from === sel.to))
    return selectWord({ state: state5, dispatch });
  let searchedText = state5.sliceDoc(ranges[0].from, ranges[0].to);
  if (state5.selection.ranges.some((r) => state5.sliceDoc(r.from, r.to) != searchedText))
    return false;
  let range = findNextOccurrence(state5, searchedText);
  if (!range)
    return false;
  dispatch(state5.update({
    selection: state5.selection.addRange(EditorSelection.range(range.from, range.to), false),
    effects: EditorView.scrollIntoView(range.to)
  }));
  return true;
};
var searchConfigFacet = Facet.define({
  combine(configs) {
    return combineConfig(configs, {
      top: false,
      caseSensitive: false,
      literal: false,
      regexp: false,
      wholeWord: false,
      createPanel: (view4) => new SearchPanel(view4),
      scrollToMatch: (range) => EditorView.scrollIntoView(range)
    });
  }
});

class SearchQuery {
  constructor(config) {
    this.search = config.search;
    this.caseSensitive = !!config.caseSensitive;
    this.literal = !!config.literal;
    this.regexp = !!config.regexp;
    this.replace = config.replace || "";
    this.valid = !!this.search && (!this.regexp || validRegExp(this.search));
    this.unquoted = this.unquote(this.search);
    this.wholeWord = !!config.wholeWord;
  }
  unquote(text) {
    return this.literal ? text : text.replace(/\\([nrt\\])/g, (_, ch) => ch == "n" ? "\n" : ch == "r" ? "\r" : ch == "t" ? "\t" : "\\");
  }
  eq(other) {
    return this.search == other.search && this.replace == other.replace && this.caseSensitive == other.caseSensitive && this.regexp == other.regexp && this.wholeWord == other.wholeWord;
  }
  create() {
    return this.regexp ? new RegExpQuery(this) : new StringQuery(this);
  }
  getCursor(state5, from = 0, to) {
    let st = state5.doc ? state5 : EditorState.create({ doc: state5 });
    if (to == null)
      to = st.doc.length;
    return this.regexp ? regexpCursor(this, st, from, to) : stringCursor(this, st, from, to);
  }
}

class QueryType2 {
  constructor(spec) {
    this.spec = spec;
  }
}

class StringQuery extends QueryType2 {
  constructor(spec) {
    super(spec);
  }
  nextMatch(state5, curFrom, curTo) {
    let cursor = stringCursor(this.spec, state5, curTo, state5.doc.length).nextOverlapping();
    if (cursor.done)
      cursor = stringCursor(this.spec, state5, 0, curFrom).nextOverlapping();
    return cursor.done ? null : cursor.value;
  }
  prevMatchInRange(state5, from, to) {
    for (let pos = to;; ) {
      let start = Math.max(from, pos - 1e4 - this.spec.unquoted.length);
      let cursor = stringCursor(this.spec, state5, start, pos), range = null;
      while (!cursor.nextOverlapping().done)
        range = cursor.value;
      if (range)
        return range;
      if (start == from)
        return null;
      pos -= 1e4;
    }
  }
  prevMatch(state5, curFrom, curTo) {
    return this.prevMatchInRange(state5, 0, curFrom) || this.prevMatchInRange(state5, curTo, state5.doc.length);
  }
  getReplacement(_result) {
    return this.spec.unquote(this.spec.replace);
  }
  matchAll(state5, limit) {
    let cursor = stringCursor(this.spec, state5, 0, state5.doc.length), ranges = [];
    while (!cursor.next().done) {
      if (ranges.length >= limit)
        return null;
      ranges.push(cursor.value);
    }
    return ranges;
  }
  highlight(state5, from, to, add2) {
    let cursor = stringCursor(this.spec, state5, Math.max(0, from - this.spec.unquoted.length), Math.min(to + this.spec.unquoted.length, state5.doc.length));
    while (!cursor.next().done)
      add2(cursor.value.from, cursor.value.to);
  }
}

class RegExpQuery extends QueryType2 {
  nextMatch(state5, curFrom, curTo) {
    let cursor = regexpCursor(this.spec, state5, curTo, state5.doc.length).next();
    if (cursor.done)
      cursor = regexpCursor(this.spec, state5, 0, curFrom).next();
    return cursor.done ? null : cursor.value;
  }
  prevMatchInRange(state5, from, to) {
    for (let size = 1;; size++) {
      let start = Math.max(from, to - size * 1e4);
      let cursor = regexpCursor(this.spec, state5, start, to), range = null;
      while (!cursor.next().done)
        range = cursor.value;
      if (range && (start == from || range.from > start + 10))
        return range;
      if (start == from)
        return null;
    }
  }
  prevMatch(state5, curFrom, curTo) {
    return this.prevMatchInRange(state5, 0, curFrom) || this.prevMatchInRange(state5, curTo, state5.doc.length);
  }
  getReplacement(result) {
    return this.spec.unquote(this.spec.replace.replace(/\$([$&\d+])/g, (m, i) => i == "$" ? "$" : i == "&" ? result.match[0] : i != "0" && +i < result.match.length ? result.match[i] : m));
  }
  matchAll(state5, limit) {
    let cursor = regexpCursor(this.spec, state5, 0, state5.doc.length), ranges = [];
    while (!cursor.next().done) {
      if (ranges.length >= limit)
        return null;
      ranges.push(cursor.value);
    }
    return ranges;
  }
  highlight(state5, from, to, add2) {
    let cursor = regexpCursor(this.spec, state5, Math.max(0, from - 250), Math.min(to + 250, state5.doc.length));
    while (!cursor.next().done)
      add2(cursor.value.from, cursor.value.to);
  }
}
var setSearchQuery = StateEffect.define();
var togglePanel = StateEffect.define();
var searchState = StateField.define({
  create(state5) {
    return new SearchState(defaultQuery(state5).create(), null);
  },
  update(value, tr) {
    for (let effect of tr.effects) {
      if (effect.is(setSearchQuery))
        value = new SearchState(effect.value.create(), value.panel);
      else if (effect.is(togglePanel))
        value = new SearchState(value.query, effect.value ? createSearchPanel : null);
    }
    return value;
  },
  provide: (f) => showPanel.from(f, (val) => val.panel)
});

class SearchState {
  constructor(query, panel) {
    this.query = query;
    this.panel = panel;
  }
}
var matchMark = Decoration.mark({ class: "cm-searchMatch" });
var selectedMatchMark = Decoration.mark({ class: "cm-searchMatch cm-searchMatch-selected" });
var searchHighlighter = ViewPlugin.fromClass(class {
  constructor(view4) {
    this.view = view4;
    this.decorations = this.highlight(view4.state.field(searchState));
  }
  update(update) {
    let state5 = update.state.field(searchState);
    if (state5 != update.startState.field(searchState) || update.docChanged || update.selectionSet || update.viewportChanged)
      this.decorations = this.highlight(state5);
  }
  highlight({ query, panel }) {
    if (!panel || !query.spec.valid)
      return Decoration.none;
    let { view: view4 } = this;
    let builder = new RangeSetBuilder;
    for (let i = 0, ranges = view4.visibleRanges, l = ranges.length;i < l; i++) {
      let { from, to } = ranges[i];
      while (i < l - 1 && to > ranges[i + 1].from - 2 * 250)
        to = ranges[++i].to;
      query.highlight(view4.state, from, to, (from2, to2) => {
        let selected = view4.state.selection.ranges.some((r) => r.from == from2 && r.to == to2);
        builder.add(from2, to2, selected ? selectedMatchMark : matchMark);
      });
    }
    return builder.finish();
  }
}, {
  decorations: (v) => v.decorations
});
var findNext = searchCommand((view4, { query }) => {
  let { to } = view4.state.selection.main;
  let next = query.nextMatch(view4.state, to, to);
  if (!next)
    return false;
  let selection = EditorSelection.single(next.from, next.to);
  let config = view4.state.facet(searchConfigFacet);
  view4.dispatch({
    selection,
    effects: [announceMatch(view4, next), config.scrollToMatch(selection.main, view4)],
    userEvent: "select.search"
  });
  selectSearchInput(view4);
  return true;
});
var findPrevious = searchCommand((view4, { query }) => {
  let { state: state5 } = view4, { from } = state5.selection.main;
  let prev = query.prevMatch(state5, from, from);
  if (!prev)
    return false;
  let selection = EditorSelection.single(prev.from, prev.to);
  let config = view4.state.facet(searchConfigFacet);
  view4.dispatch({
    selection,
    effects: [announceMatch(view4, prev), config.scrollToMatch(selection.main, view4)],
    userEvent: "select.search"
  });
  selectSearchInput(view4);
  return true;
});
var selectMatches = searchCommand((view4, { query }) => {
  let ranges = query.matchAll(view4.state, 1000);
  if (!ranges || !ranges.length)
    return false;
  view4.dispatch({
    selection: EditorSelection.create(ranges.map((r) => EditorSelection.range(r.from, r.to))),
    userEvent: "select.search.matches"
  });
  return true;
});
var selectSelectionMatches = ({ state: state5, dispatch }) => {
  let sel = state5.selection;
  if (sel.ranges.length > 1 || sel.main.empty)
    return false;
  let { from, to } = sel.main;
  let ranges = [], main = 0;
  for (let cur = new SearchCursor(state5.doc, state5.sliceDoc(from, to));!cur.next().done; ) {
    if (ranges.length > 1000)
      return false;
    if (cur.value.from == from)
      main = ranges.length;
    ranges.push(EditorSelection.range(cur.value.from, cur.value.to));
  }
  dispatch(state5.update({
    selection: EditorSelection.create(ranges, main),
    userEvent: "select.search.matches"
  }));
  return true;
};
var replaceNext = searchCommand((view4, { query }) => {
  let { state: state5 } = view4, { from, to } = state5.selection.main;
  if (state5.readOnly)
    return false;
  let next = query.nextMatch(state5, from, from);
  if (!next)
    return false;
  let changes = [], selection, replacement;
  let effects = [];
  if (next.from == from && next.to == to) {
    replacement = state5.toText(query.getReplacement(next));
    changes.push({ from: next.from, to: next.to, insert: replacement });
    next = query.nextMatch(state5, next.from, next.to);
    effects.push(EditorView.announce.of(state5.phrase("replaced match on line $", state5.doc.lineAt(from).number) + "."));
  }
  if (next) {
    let off = changes.length == 0 || changes[0].from >= next.to ? 0 : next.to - next.from - replacement.length;
    selection = EditorSelection.single(next.from - off, next.to - off);
    effects.push(announceMatch(view4, next));
    effects.push(state5.facet(searchConfigFacet).scrollToMatch(selection.main, view4));
  }
  view4.dispatch({
    changes,
    selection,
    effects,
    userEvent: "input.replace"
  });
  return true;
});
var replaceAll = searchCommand((view4, { query }) => {
  if (view4.state.readOnly)
    return false;
  let changes = query.matchAll(view4.state, 1e9).map((match) => {
    let { from, to } = match;
    return { from, to, insert: query.getReplacement(match) };
  });
  if (!changes.length)
    return false;
  let announceText = view4.state.phrase("replaced $ matches", changes.length) + ".";
  view4.dispatch({
    changes,
    effects: EditorView.announce.of(announceText),
    userEvent: "input.replace.all"
  });
  return true;
});
var openSearchPanel = (view4) => {
  let state5 = view4.state.field(searchState, false);
  if (state5 && state5.panel) {
    let searchInput = getSearchInput(view4);
    if (searchInput && searchInput != view4.root.activeElement) {
      let query = defaultQuery(view4.state, state5.query.spec);
      if (query.valid)
        view4.dispatch({ effects: setSearchQuery.of(query) });
      searchInput.focus();
      searchInput.select();
    }
  } else {
    view4.dispatch({ effects: [
      togglePanel.of(true),
      state5 ? setSearchQuery.of(defaultQuery(view4.state, state5.query.spec)) : StateEffect.appendConfig.of(searchExtensions)
    ] });
  }
  return true;
};
var closeSearchPanel = (view4) => {
  let state5 = view4.state.field(searchState, false);
  if (!state5 || !state5.panel)
    return false;
  let panel = getPanel(view4, createSearchPanel);
  if (panel && panel.dom.contains(view4.root.activeElement))
    view4.focus();
  view4.dispatch({ effects: togglePanel.of(false) });
  return true;
};
var searchKeymap = [
  { key: "Mod-f", run: openSearchPanel, scope: "editor search-panel" },
  { key: "F3", run: findNext, shift: findPrevious, scope: "editor search-panel", preventDefault: true },
  { key: "Mod-g", run: findNext, shift: findPrevious, scope: "editor search-panel", preventDefault: true },
  { key: "Escape", run: closeSearchPanel, scope: "editor search-panel" },
  { key: "Mod-Shift-l", run: selectSelectionMatches },
  { key: "Alt-g", run: gotoLine },
  { key: "Mod-d", run: selectNextOccurrence, preventDefault: true }
];

class SearchPanel {
  constructor(view4) {
    this.view = view4;
    let query = this.query = view4.state.field(searchState).query.spec;
    this.commit = this.commit.bind(this);
    this.searchField = crelt("input", {
      value: query.search,
      placeholder: phrase(view4, "Find"),
      "aria-label": phrase(view4, "Find"),
      class: "cm-textfield",
      name: "search",
      form: "",
      "main-field": "true",
      onchange: this.commit,
      onkeyup: this.commit
    });
    this.replaceField = crelt("input", {
      value: query.replace,
      placeholder: phrase(view4, "Replace"),
      "aria-label": phrase(view4, "Replace"),
      class: "cm-textfield",
      name: "replace",
      form: "",
      onchange: this.commit,
      onkeyup: this.commit
    });
    this.caseField = crelt("input", {
      type: "checkbox",
      name: "case",
      form: "",
      checked: query.caseSensitive,
      onchange: this.commit
    });
    this.reField = crelt("input", {
      type: "checkbox",
      name: "re",
      form: "",
      checked: query.regexp,
      onchange: this.commit
    });
    this.wordField = crelt("input", {
      type: "checkbox",
      name: "word",
      form: "",
      checked: query.wholeWord,
      onchange: this.commit
    });
    function button(name2, onclick, content2) {
      return crelt("button", { class: "cm-button", name: name2, onclick, type: "button" }, content2);
    }
    this.dom = crelt("div", { onkeydown: (e) => this.keydown(e), class: "cm-search" }, [
      this.searchField,
      button("next", () => findNext(view4), [phrase(view4, "next")]),
      button("prev", () => findPrevious(view4), [phrase(view4, "previous")]),
      button("select", () => selectMatches(view4), [phrase(view4, "all")]),
      crelt("label", null, [this.caseField, phrase(view4, "match case")]),
      crelt("label", null, [this.reField, phrase(view4, "regexp")]),
      crelt("label", null, [this.wordField, phrase(view4, "by word")]),
      ...view4.state.readOnly ? [] : [
        crelt("br"),
        this.replaceField,
        button("replace", () => replaceNext(view4), [phrase(view4, "replace")]),
        button("replaceAll", () => replaceAll(view4), [phrase(view4, "replace all")])
      ],
      crelt("button", {
        name: "close",
        onclick: () => closeSearchPanel(view4),
        "aria-label": phrase(view4, "close"),
        type: "button"
      }, ["\xD7"])
    ]);
  }
  commit() {
    let query = new SearchQuery({
      search: this.searchField.value,
      caseSensitive: this.caseField.checked,
      regexp: this.reField.checked,
      wholeWord: this.wordField.checked,
      replace: this.replaceField.value
    });
    if (!query.eq(this.query)) {
      this.query = query;
      this.view.dispatch({ effects: setSearchQuery.of(query) });
    }
  }
  keydown(e) {
    if (runScopeHandlers(this.view, e, "search-panel")) {
      e.preventDefault();
    } else if (e.keyCode == 13 && e.target == this.searchField) {
      e.preventDefault();
      (e.shiftKey ? findPrevious : findNext)(this.view);
    } else if (e.keyCode == 13 && e.target == this.replaceField) {
      e.preventDefault();
      replaceNext(this.view);
    }
  }
  update(update) {
    for (let tr of update.transactions)
      for (let effect of tr.effects) {
        if (effect.is(setSearchQuery) && !effect.value.eq(this.query))
          this.setQuery(effect.value);
      }
  }
  setQuery(query) {
    this.query = query;
    this.searchField.value = query.search;
    this.replaceField.value = query.replace;
    this.caseField.checked = query.caseSensitive;
    this.reField.checked = query.regexp;
    this.wordField.checked = query.wholeWord;
  }
  mount() {
    this.searchField.select();
  }
  get pos() {
    return 80;
  }
  get top() {
    return this.view.state.facet(searchConfigFacet).top;
  }
}
var AnnounceMargin = 30;
var Break = /[\s\.,:;?!]/;
var baseTheme3 = EditorView.baseTheme({
  ".cm-panel.cm-search": {
    padding: "2px 6px 4px",
    position: "relative",
    "& [name=close]": {
      position: "absolute",
      top: "0",
      right: "4px",
      backgroundColor: "inherit",
      border: "none",
      font: "inherit",
      padding: 0,
      margin: 0
    },
    "& input, & button, & label": {
      margin: ".2em .6em .2em 0"
    },
    "& input[type=checkbox]": {
      marginRight: ".2em"
    },
    "& label": {
      fontSize: "80%",
      whiteSpace: "pre"
    }
  },
  "&light .cm-searchMatch": { backgroundColor: "#ffff0054" },
  "&dark .cm-searchMatch": { backgroundColor: "#00ffff8a" },
  "&light .cm-searchMatch-selected": { backgroundColor: "#ff6a0054" },
  "&dark .cm-searchMatch-selected": { backgroundColor: "#ff00ff8a" }
});
var searchExtensions = [
  searchState,
  Prec.low(searchHighlighter),
  baseTheme3
];

// /home/ray/Code/diagramatics-site/node_modules/@codemirror/autocomplete/dist/index.js
var toSet = function(chars) {
  let flat = Object.keys(chars).join("");
  let words = /\w/.test(flat);
  if (words)
    flat = flat.replace(/\w/g, "");
  return `[${words ? "\\w" : ""}${flat.replace(/[^\w\s]/g, "\\$&")}]`;
};
var prefixMatch = function(options) {
  let first = Object.create(null), rest = Object.create(null);
  for (let { label } of options) {
    first[label[0]] = true;
    for (let i = 1;i < label.length; i++)
      rest[label[i]] = true;
  }
  let source = toSet(first) + toSet(rest) + "*$";
  return [new RegExp("^" + source), new RegExp(source)];
};
var completeFromList = function(list) {
  let options = list.map((o) => typeof o == "string" ? { label: o } : o);
  let [validFor, match] = options.every((o) => /^\w+$/.test(o.label)) ? [/\w*$/, /\w+$/] : prefixMatch(options);
  return (context) => {
    let token = context.matchBefore(match);
    return token || context.explicit ? { from: token ? token.from : context.pos, options, validFor } : null;
  };
};
var ifNotIn = function(nodes, source) {
  return (context) => {
    for (let pos = syntaxTree(context.state).resolveInner(context.pos, -1);pos; pos = pos.parent) {
      if (nodes.indexOf(pos.name) > -1)
        return null;
      if (pos.type.isTop)
        break;
    }
    return source(context);
  };
};
var cur = function(state6) {
  return state6.selection.main.from;
};
var ensureAnchor = function(expr, start) {
  var _a2;
  let { source } = expr;
  let addStart = start && source[0] != "^", addEnd = source[source.length - 1] != "$";
  if (!addStart && !addEnd)
    return expr;
  return new RegExp(`${addStart ? "^" : ""}(?:${source})${addEnd ? "$" : ""}`, (_a2 = expr.flags) !== null && _a2 !== undefined ? _a2 : expr.ignoreCase ? "i" : "");
};
var insertCompletionText = function(state6, text, from, to) {
  let { main } = state6.selection, fromOff = from - main.from, toOff = to - main.from;
  return Object.assign(Object.assign({}, state6.changeByRange((range) => {
    if (range != main && from != to && state6.sliceDoc(range.from + fromOff, range.from + toOff) != state6.sliceDoc(from, to))
      return { range };
    return {
      changes: { from: range.from + fromOff, to: to == main.from ? range.to : range.from + toOff, insert: text },
      range: EditorSelection.cursor(range.from + fromOff + text.length)
    };
  })), { userEvent: "input.complete" });
};
var asSource = function(source) {
  if (!Array.isArray(source))
    return source;
  let known = SourceCache.get(source);
  if (!known)
    SourceCache.set(source, known = completeFromList(source));
  return known;
};
var joinClass = function(a, b) {
  return a ? b ? a + " " + b : a : b;
};
var defaultPositionInfo = function(view5, list, option, info, space) {
  let rtl = view5.textDirection == Direction.RTL, left = rtl, narrow = false;
  let side = "top", offset, maxWidth;
  let spaceLeft = list.left - space.left, spaceRight = space.right - list.right;
  let infoWidth = info.right - info.left, infoHeight = info.bottom - info.top;
  if (left && spaceLeft < Math.min(infoWidth, spaceRight))
    left = false;
  else if (!left && spaceRight < Math.min(infoWidth, spaceLeft))
    left = true;
  if (infoWidth <= (left ? spaceLeft : spaceRight)) {
    offset = Math.max(space.top, Math.min(option.top, space.bottom - infoHeight)) - list.top;
    maxWidth = Math.min(400, left ? spaceLeft : spaceRight);
  } else {
    narrow = true;
    maxWidth = Math.min(400, (rtl ? list.right : space.right - list.left) - 30);
    let spaceBelow = space.bottom - list.bottom;
    if (spaceBelow >= infoHeight || spaceBelow > list.top) {
      offset = option.bottom - list.top;
    } else {
      side = "bottom";
      offset = list.bottom - option.top;
    }
  }
  return {
    style: `${side}: ${offset}px; max-width: ${maxWidth}px`,
    class: "cm-completionInfo-" + (narrow ? rtl ? "left-narrow" : "right-narrow" : left ? "left" : "right")
  };
};
var optionContent = function(config) {
  let content2 = config.addToOptions.slice();
  if (config.icons)
    content2.push({
      render(completion) {
        let icon = document.createElement("div");
        icon.classList.add("cm-completionIcon");
        if (completion.type)
          icon.classList.add(...completion.type.split(/\s+/g).map((cls) => "cm-completionIcon-" + cls));
        icon.setAttribute("aria-hidden", "true");
        return icon;
      },
      position: 20
    });
  content2.push({
    render(completion, _s, match) {
      let labelElt = document.createElement("span");
      labelElt.className = "cm-completionLabel";
      let label = completion.displayLabel || completion.label, off = 0;
      for (let j = 0;j < match.length; ) {
        let from = match[j++], to = match[j++];
        if (from > off)
          labelElt.appendChild(document.createTextNode(label.slice(off, from)));
        let span = labelElt.appendChild(document.createElement("span"));
        span.appendChild(document.createTextNode(label.slice(from, to)));
        span.className = "cm-completionMatchedText";
        off = to;
      }
      if (off < label.length)
        labelElt.appendChild(document.createTextNode(label.slice(off)));
      return labelElt;
    },
    position: 50
  }, {
    render(completion) {
      if (!completion.detail)
        return null;
      let detailElt = document.createElement("span");
      detailElt.className = "cm-completionDetail";
      detailElt.textContent = completion.detail;
      return detailElt;
    },
    position: 80
  });
  return content2.sort((a, b) => a.position - b.position).map((a) => a.render);
};
var rangeAroundSelected = function(total, selected, max) {
  if (total <= max)
    return { from: 0, to: total };
  if (selected < 0)
    selected = 0;
  if (selected <= total >> 1) {
    let off2 = Math.floor(selected / max);
    return { from: off2 * max, to: (off2 + 1) * max };
  }
  let off = Math.floor((total - selected) / max);
  return { from: total - (off + 1) * max, to: total - off * max };
};
var completionTooltip = function(stateField, applyCompletion) {
  return (view5) => new CompletionTooltip(view5, stateField, applyCompletion);
};
var scrollIntoView2 = function(container, element) {
  let parent = container.getBoundingClientRect();
  let self = element.getBoundingClientRect();
  if (self.top < parent.top)
    container.scrollTop -= parent.top - self.top;
  else if (self.bottom > parent.bottom)
    container.scrollTop += self.bottom - parent.bottom;
};
var score = function(option) {
  return (option.boost || 0) * 100 + (option.apply ? 10 : 0) + (option.info ? 5 : 0) + (option.type ? 1 : 0);
};
var sortOptions = function(active, state6) {
  let options = [];
  let sections = null;
  let addOption = (option) => {
    options.push(option);
    let { section } = option.completion;
    if (section) {
      if (!sections)
        sections = [];
      let name2 = typeof section == "string" ? section : section.name;
      if (!sections.some((s) => s.name == name2))
        sections.push(typeof section == "string" ? { name: name2 } : section);
    }
  };
  for (let a of active)
    if (a.hasResult()) {
      let getMatch = a.result.getMatch;
      if (a.result.filter === false) {
        for (let option of a.result.options) {
          addOption(new Option(option, a.source, getMatch ? getMatch(option) : [], 1e9 - options.length));
        }
      } else {
        let matcher = new FuzzyMatcher(state6.sliceDoc(a.from, a.to));
        for (let option of a.result.options)
          if (matcher.match(option.label)) {
            let matched = !option.displayLabel ? matcher.matched : getMatch ? getMatch(option, matcher.matched) : [];
            addOption(new Option(option, a.source, matched, matcher.score + (option.boost || 0)));
          }
      }
    }
  if (sections) {
    let sectionOrder = Object.create(null), pos = 0;
    let cmp = (a, b) => {
      var _a2, _b;
      return ((_a2 = a.rank) !== null && _a2 !== undefined ? _a2 : 1e9) - ((_b = b.rank) !== null && _b !== undefined ? _b : 1e9) || (a.name < b.name ? -1 : 1);
    };
    for (let s of sections.sort(cmp)) {
      pos -= 1e5;
      sectionOrder[s.name] = pos;
    }
    for (let option of options) {
      let { section } = option.completion;
      if (section)
        option.score += sectionOrder[typeof section == "string" ? section : section.name];
    }
  }
  let result = [], prev = null;
  let compare2 = state6.facet(completionConfig).compareCompletions;
  for (let opt of options.sort((a, b) => b.score - a.score || compare2(a.completion, b.completion))) {
    let cur2 = opt.completion;
    if (!prev || prev.label != cur2.label || prev.detail != cur2.detail || prev.type != null && cur2.type != null && prev.type != cur2.type || prev.apply != cur2.apply || prev.boost != cur2.boost)
      result.push(opt);
    else if (score(opt.completion) > score(prev))
      result[result.length - 1] = opt;
    prev = opt.completion;
  }
  return result;
};
var sameResults = function(a, b) {
  if (a == b)
    return true;
  for (let iA = 0, iB = 0;; ) {
    while (iA < a.length && !a[iA].hasResult)
      iA++;
    while (iB < b.length && !b[iB].hasResult)
      iB++;
    let endA = iA == a.length, endB = iB == b.length;
    if (endA || endB)
      return endA == endB;
    if (a[iA++].result != b[iB++].result)
      return false;
  }
};
var makeAttrs = function(id, selected) {
  let result = {
    "aria-autocomplete": "list",
    "aria-haspopup": "listbox",
    "aria-controls": id
  };
  if (selected > -1)
    result["aria-activedescendant"] = id + "-" + selected;
  return result;
};
var getUserEvent = function(tr) {
  return tr.isUserEvent("input.type") ? "input" : tr.isUserEvent("delete.backward") ? "delete" : null;
};
var checkValid = function(validFor, state6, from, to) {
  if (!validFor)
    return false;
  let text = state6.sliceDoc(from, to);
  return typeof validFor == "function" ? validFor(text, from, to, state6) : ensureAnchor(validFor, true).test(text);
};
var applyCompletion = function(view5, option) {
  const apply = option.completion.apply || option.completion.label;
  let result = view5.state.field(completionState).active.find((a) => a.source == option.source);
  if (!(result instanceof ActiveResult))
    return false;
  if (typeof apply == "string")
    view5.dispatch(Object.assign(Object.assign({}, insertCompletionText(view5.state, apply, result.from, result.to)), { annotations: pickedCompletion.of(option.completion) }));
  else
    apply(view5, option.completion, result.from, result.to);
  return true;
};
var moveCompletionSelection = function(forward, by = "option") {
  return (view5) => {
    let cState = view5.state.field(completionState, false);
    if (!cState || !cState.open || cState.open.disabled || Date.now() - cState.open.timestamp < view5.state.facet(completionConfig).interactionDelay)
      return false;
    let step = 1, tooltip;
    if (by == "page" && (tooltip = getTooltip(view5, cState.open.tooltip)))
      step = Math.max(2, Math.floor(tooltip.dom.offsetHeight / tooltip.dom.querySelector("li").offsetHeight) - 1);
    let { length } = cState.open.options;
    let selected = cState.open.selected > -1 ? cState.open.selected + step * (forward ? 1 : -1) : forward ? 0 : length - 1;
    if (selected < 0)
      selected = by == "page" ? 0 : length - 1;
    else if (selected >= length)
      selected = by == "page" ? length - 1 : 0;
    view5.dispatch({ effects: setSelectedEffect.of(selected) });
    return true;
  };
};
var fieldSelection = function(ranges, field) {
  return EditorSelection.create(ranges.filter((r) => r.field == field).map((r) => EditorSelection.range(r.from, r.to)));
};
var snippet = function(template) {
  let snippet2 = Snippet.parse(template);
  return (editor, completion, from, to) => {
    let { text, ranges } = snippet2.instantiate(editor.state, from);
    let spec = {
      changes: { from, to, insert: Text.of(text) },
      scrollIntoView: true,
      annotations: completion ? pickedCompletion.of(completion) : undefined
    };
    if (ranges.length)
      spec.selection = fieldSelection(ranges, 0);
    if (ranges.length > 1) {
      let active = new ActiveSnippet(ranges, 0);
      let effects = spec.effects = [setActive.of(active)];
      if (editor.state.field(snippetState, false) === undefined)
        effects.push(StateEffect.appendConfig.of([snippetState, addSnippetKeymap, snippetPointerHandler, baseTheme4]));
    }
    editor.dispatch(editor.state.update(spec));
  };
};
var moveField = function(dir) {
  return ({ state: state6, dispatch }) => {
    let active = state6.field(snippetState, false);
    if (!active || dir < 0 && active.active == 0)
      return false;
    let next = active.active + dir, last = dir > 0 && !active.ranges.some((r) => r.field == next + dir);
    dispatch(state6.update({
      selection: fieldSelection(active.ranges, next),
      effects: setActive.of(last ? null : new ActiveSnippet(active.ranges, next))
    }));
    return true;
  };
};
var snippetCompletion = function(template, completion) {
  return Object.assign(Object.assign({}, completion), { apply: snippet(template) });
};
var closeBrackets = function() {
  return [inputHandler2, bracketState];
};
var closing = function(ch) {
  for (let i = 0;i < definedClosing.length; i += 2)
    if (definedClosing.charCodeAt(i) == ch)
      return definedClosing.charAt(i + 1);
  return fromCodePoint(ch < 128 ? ch : ch + 1);
};
var config = function(state6, pos) {
  return state6.languageDataAt("closeBrackets", pos)[0] || defaults2;
};
var insertBracket = function(state6, bracket2) {
  let conf = config(state6, state6.selection.main.head);
  let tokens = conf.brackets || defaults2.brackets;
  for (let tok of tokens) {
    let closed = closing(codePointAt(tok, 0));
    if (bracket2 == tok)
      return closed == tok ? handleSame(state6, tok, tokens.indexOf(tok + tok + tok) > -1, conf) : handleOpen(state6, tok, closed, conf.before || defaults2.before);
    if (bracket2 == closed && closedBracketAt(state6, state6.selection.main.from))
      return handleClose(state6, tok, closed);
  }
  return null;
};
var closedBracketAt = function(state6, pos) {
  let found = false;
  state6.field(bracketState).between(0, state6.doc.length, (from) => {
    if (from == pos)
      found = true;
  });
  return found;
};
var nextChar = function(doc2, pos) {
  let next = doc2.sliceString(pos, pos + 2);
  return next.slice(0, codePointSize(codePointAt(next, 0)));
};
var prevChar = function(doc2, pos) {
  let prev = doc2.sliceString(pos - 2, pos);
  return codePointSize(codePointAt(prev, 0)) == prev.length ? prev : prev.slice(1);
};
var handleOpen = function(state6, open, close, closeBefore) {
  let dont = null, changes = state6.changeByRange((range) => {
    if (!range.empty)
      return {
        changes: [{ insert: open, from: range.from }, { insert: close, from: range.to }],
        effects: closeBracketEffect.of(range.to + open.length),
        range: EditorSelection.range(range.anchor + open.length, range.head + open.length)
      };
    let next = nextChar(state6.doc, range.head);
    if (!next || /\s/.test(next) || closeBefore.indexOf(next) > -1)
      return {
        changes: { insert: open + close, from: range.head },
        effects: closeBracketEffect.of(range.head + open.length),
        range: EditorSelection.cursor(range.head + open.length)
      };
    return { range: dont = range };
  });
  return dont ? null : state6.update(changes, {
    scrollIntoView: true,
    userEvent: "input.type"
  });
};
var handleClose = function(state6, _open, close) {
  let dont = null, changes = state6.changeByRange((range) => {
    if (range.empty && nextChar(state6.doc, range.head) == close)
      return {
        changes: { from: range.head, to: range.head + close.length, insert: close },
        range: EditorSelection.cursor(range.head + close.length)
      };
    return dont = { range };
  });
  return dont ? null : state6.update(changes, {
    scrollIntoView: true,
    userEvent: "input.type"
  });
};
var handleSame = function(state6, token, allowTriple, config2) {
  let stringPrefixes = config2.stringPrefixes || defaults2.stringPrefixes;
  let dont = null, changes = state6.changeByRange((range) => {
    if (!range.empty)
      return {
        changes: [{ insert: token, from: range.from }, { insert: token, from: range.to }],
        effects: closeBracketEffect.of(range.to + token.length),
        range: EditorSelection.range(range.anchor + token.length, range.head + token.length)
      };
    let pos = range.head, next = nextChar(state6.doc, pos), start;
    if (next == token) {
      if (nodeStart(state6, pos)) {
        return {
          changes: { insert: token + token, from: pos },
          effects: closeBracketEffect.of(pos + token.length),
          range: EditorSelection.cursor(pos + token.length)
        };
      } else if (closedBracketAt(state6, pos)) {
        let isTriple = allowTriple && state6.sliceDoc(pos, pos + token.length * 3) == token + token + token;
        let content2 = isTriple ? token + token + token : token;
        return {
          changes: { from: pos, to: pos + content2.length, insert: content2 },
          range: EditorSelection.cursor(pos + content2.length)
        };
      }
    } else if (allowTriple && state6.sliceDoc(pos - 2 * token.length, pos) == token + token && (start = canStartStringAt(state6, pos - 2 * token.length, stringPrefixes)) > -1 && nodeStart(state6, start)) {
      return {
        changes: { insert: token + token + token + token, from: pos },
        effects: closeBracketEffect.of(pos + token.length),
        range: EditorSelection.cursor(pos + token.length)
      };
    } else if (state6.charCategorizer(pos)(next) != CharCategory.Word) {
      if (canStartStringAt(state6, pos, stringPrefixes) > -1 && !probablyInString(state6, pos, token, stringPrefixes))
        return {
          changes: { insert: token + token, from: pos },
          effects: closeBracketEffect.of(pos + token.length),
          range: EditorSelection.cursor(pos + token.length)
        };
    }
    return { range: dont = range };
  });
  return dont ? null : state6.update(changes, {
    scrollIntoView: true,
    userEvent: "input.type"
  });
};
var nodeStart = function(state6, pos) {
  let tree = syntaxTree(state6).resolveInner(pos + 1);
  return tree.parent && tree.from == pos;
};
var probablyInString = function(state6, pos, quoteToken, prefixes) {
  let node = syntaxTree(state6).resolveInner(pos, -1);
  let maxPrefix = prefixes.reduce((m, p) => Math.max(m, p.length), 0);
  for (let i = 0;i < 5; i++) {
    let start = state6.sliceDoc(node.from, Math.min(node.to, node.from + quoteToken.length + maxPrefix));
    let quotePos = start.indexOf(quoteToken);
    if (!quotePos || quotePos > -1 && prefixes.indexOf(start.slice(0, quotePos)) > -1) {
      let first = node.firstChild;
      while (first && first.from == node.from && first.to - first.from > quoteToken.length + quotePos) {
        if (state6.sliceDoc(first.to - quoteToken.length, first.to) == quoteToken)
          return false;
        first = first.firstChild;
      }
      return true;
    }
    let parent = node.to == pos && node.parent;
    if (!parent)
      break;
    node = parent;
  }
  return false;
};
var canStartStringAt = function(state6, pos, prefixes) {
  let charCat = state6.charCategorizer(pos);
  if (charCat(state6.sliceDoc(pos - 1, pos)) != CharCategory.Word)
    return pos;
  for (let prefix of prefixes) {
    let start = pos - prefix.length;
    if (state6.sliceDoc(start, pos) == prefix && charCat(state6.sliceDoc(start - 1, start)) != CharCategory.Word)
      return start;
  }
  return -1;
};
var autocompletion = function(config2 = {}) {
  return [
    completionState,
    completionConfig.of(config2),
    completionPlugin,
    completionKeymapExt,
    baseTheme4
  ];
};
class CompletionContext {
  constructor(state6, pos, explicit) {
    this.state = state6;
    this.pos = pos;
    this.explicit = explicit;
    this.abortListeners = [];
  }
  tokenBefore(types2) {
    let token = syntaxTree(this.state).resolveInner(this.pos, -1);
    while (token && types2.indexOf(token.name) < 0)
      token = token.parent;
    return token ? {
      from: token.from,
      to: this.pos,
      text: this.state.sliceDoc(token.from, this.pos),
      type: token.type
    } : null;
  }
  matchBefore(expr) {
    let line = this.state.doc.lineAt(this.pos);
    let start = Math.max(line.from, this.pos - 250);
    let str = line.text.slice(start - line.from, this.pos - line.from);
    let found = str.search(ensureAnchor(expr, false));
    return found < 0 ? null : { from: start + found, to: this.pos, text: str.slice(found) };
  }
  get aborted() {
    return this.abortListeners == null;
  }
  addEventListener(type, listener) {
    if (type == "abort" && this.abortListeners)
      this.abortListeners.push(listener);
  }
}

class Option {
  constructor(completion, source, match, score2) {
    this.completion = completion;
    this.source = source;
    this.match = match;
    this.score = score2;
  }
}
var pickedCompletion = Annotation.define();
var SourceCache = new WeakMap;
var startCompletionEffect = StateEffect.define();
var closeCompletionEffect = StateEffect.define();

class FuzzyMatcher {
  constructor(pattern) {
    this.pattern = pattern;
    this.chars = [];
    this.folded = [];
    this.any = [];
    this.precise = [];
    this.byWord = [];
    this.score = 0;
    this.matched = [];
    for (let p = 0;p < pattern.length; ) {
      let char = codePointAt(pattern, p), size = codePointSize(char);
      this.chars.push(char);
      let part = pattern.slice(p, p + size), upper = part.toUpperCase();
      this.folded.push(codePointAt(upper == part ? part.toLowerCase() : upper, 0));
      p += size;
    }
    this.astral = pattern.length != this.chars.length;
  }
  ret(score2, matched) {
    this.score = score2;
    this.matched = matched;
    return true;
  }
  match(word) {
    if (this.pattern.length == 0)
      return this.ret(-100, []);
    if (word.length < this.pattern.length)
      return false;
    let { chars, folded, any, precise, byWord } = this;
    if (chars.length == 1) {
      let first = codePointAt(word, 0), firstSize = codePointSize(first);
      let score2 = firstSize == word.length ? 0 : -100;
      if (first == chars[0])
        ;
      else if (first == folded[0])
        score2 += -200;
      else
        return false;
      return this.ret(score2, [0, firstSize]);
    }
    let direct = word.indexOf(this.pattern);
    if (direct == 0)
      return this.ret(word.length == this.pattern.length ? 0 : -100, [0, this.pattern.length]);
    let len = chars.length, anyTo = 0;
    if (direct < 0) {
      for (let i = 0, e = Math.min(word.length, 200);i < e && anyTo < len; ) {
        let next = codePointAt(word, i);
        if (next == chars[anyTo] || next == folded[anyTo])
          any[anyTo++] = i;
        i += codePointSize(next);
      }
      if (anyTo < len)
        return false;
    }
    let preciseTo = 0;
    let byWordTo = 0, byWordFolded = false;
    let adjacentTo = 0, adjacentStart = -1, adjacentEnd = -1;
    let hasLower = /[a-z]/.test(word), wordAdjacent = true;
    for (let i = 0, e = Math.min(word.length, 200), prevType = 0;i < e && byWordTo < len; ) {
      let next = codePointAt(word, i);
      if (direct < 0) {
        if (preciseTo < len && next == chars[preciseTo])
          precise[preciseTo++] = i;
        if (adjacentTo < len) {
          if (next == chars[adjacentTo] || next == folded[adjacentTo]) {
            if (adjacentTo == 0)
              adjacentStart = i;
            adjacentEnd = i + 1;
            adjacentTo++;
          } else {
            adjacentTo = 0;
          }
        }
      }
      let ch, type = next < 255 ? next >= 48 && next <= 57 || next >= 97 && next <= 122 ? 2 : next >= 65 && next <= 90 ? 1 : 0 : (ch = fromCodePoint(next)) != ch.toLowerCase() ? 1 : ch != ch.toUpperCase() ? 2 : 0;
      if (!i || type == 1 && hasLower || prevType == 0 && type != 0) {
        if (chars[byWordTo] == next || folded[byWordTo] == next && (byWordFolded = true))
          byWord[byWordTo++] = i;
        else if (byWord.length)
          wordAdjacent = false;
      }
      prevType = type;
      i += codePointSize(next);
    }
    if (byWordTo == len && byWord[0] == 0 && wordAdjacent)
      return this.result(-100 + (byWordFolded ? -200 : 0), byWord, word);
    if (adjacentTo == len && adjacentStart == 0)
      return this.ret(-200 - word.length + (adjacentEnd == word.length ? 0 : -100), [0, adjacentEnd]);
    if (direct > -1)
      return this.ret(-700 - word.length, [direct, direct + this.pattern.length]);
    if (adjacentTo == len)
      return this.ret(-200 + -700 - word.length, [adjacentStart, adjacentEnd]);
    if (byWordTo == len)
      return this.result(-100 + (byWordFolded ? -200 : 0) + -700 + (wordAdjacent ? 0 : -1100), byWord, word);
    return chars.length == 2 ? false : this.result((any[0] ? -700 : 0) + -200 + -1100, any, word);
  }
  result(score2, positions, word) {
    let result = [], i = 0;
    for (let pos of positions) {
      let to = pos + (this.astral ? codePointSize(codePointAt(word, pos)) : 1);
      if (i && result[i - 1] == pos)
        result[i - 1] = to;
      else {
        result[i++] = pos;
        result[i++] = to;
      }
    }
    return this.ret(score2 - word.length, result);
  }
}
var completionConfig = Facet.define({
  combine(configs) {
    return combineConfig(configs, {
      activateOnTyping: true,
      selectOnOpen: true,
      override: null,
      closeOnBlur: true,
      maxRenderedOptions: 100,
      defaultKeymap: true,
      tooltipClass: () => "",
      optionClass: () => "",
      aboveCursor: false,
      icons: true,
      addToOptions: [],
      positionInfo: defaultPositionInfo,
      compareCompletions: (a, b) => a.label.localeCompare(b.label),
      interactionDelay: 75
    }, {
      defaultKeymap: (a, b) => a && b,
      closeOnBlur: (a, b) => a && b,
      icons: (a, b) => a && b,
      tooltipClass: (a, b) => (c) => joinClass(a(c), b(c)),
      optionClass: (a, b) => (c) => joinClass(a(c), b(c)),
      addToOptions: (a, b) => a.concat(b)
    });
  }
});

class CompletionTooltip {
  constructor(view5, stateField, applyCompletion2) {
    this.view = view5;
    this.stateField = stateField;
    this.applyCompletion = applyCompletion2;
    this.info = null;
    this.infoDestroy = null;
    this.placeInfoReq = {
      read: () => this.measureInfo(),
      write: (pos) => this.placeInfo(pos),
      key: this
    };
    this.space = null;
    this.currentClass = "";
    let cState = view5.state.field(stateField);
    let { options, selected } = cState.open;
    let config2 = view5.state.facet(completionConfig);
    this.optionContent = optionContent(config2);
    this.optionClass = config2.optionClass;
    this.tooltipClass = config2.tooltipClass;
    this.range = rangeAroundSelected(options.length, selected, config2.maxRenderedOptions);
    this.dom = document.createElement("div");
    this.dom.className = "cm-tooltip-autocomplete";
    this.updateTooltipClass(view5.state);
    this.dom.addEventListener("mousedown", (e) => {
      for (let dom = e.target, match;dom && dom != this.dom; dom = dom.parentNode) {
        if (dom.nodeName == "LI" && (match = /-(\d+)$/.exec(dom.id)) && +match[1] < options.length) {
          this.applyCompletion(view5, options[+match[1]]);
          e.preventDefault();
          return;
        }
      }
    });
    this.dom.addEventListener("focusout", (e) => {
      let state6 = view5.state.field(this.stateField, false);
      if (state6 && state6.tooltip && view5.state.facet(completionConfig).closeOnBlur && e.relatedTarget != view5.contentDOM)
        view5.dispatch({ effects: closeCompletionEffect.of(null) });
    });
    this.list = this.dom.appendChild(this.createListBox(options, cState.id, this.range));
    this.list.addEventListener("scroll", () => {
      if (this.info)
        this.view.requestMeasure(this.placeInfoReq);
    });
  }
  mount() {
    this.updateSel();
  }
  update(update) {
    var _a2, _b, _c;
    let cState = update.state.field(this.stateField);
    let prevState = update.startState.field(this.stateField);
    this.updateTooltipClass(update.state);
    if (cState != prevState) {
      this.updateSel();
      if (((_a2 = cState.open) === null || _a2 === undefined ? undefined : _a2.disabled) != ((_b = prevState.open) === null || _b === undefined ? undefined : _b.disabled))
        this.dom.classList.toggle("cm-tooltip-autocomplete-disabled", !!((_c = cState.open) === null || _c === undefined ? undefined : _c.disabled));
    }
  }
  updateTooltipClass(state6) {
    let cls = this.tooltipClass(state6);
    if (cls != this.currentClass) {
      for (let c of this.currentClass.split(" "))
        if (c)
          this.dom.classList.remove(c);
      for (let c of cls.split(" "))
        if (c)
          this.dom.classList.add(c);
      this.currentClass = cls;
    }
  }
  positioned(space) {
    this.space = space;
    if (this.info)
      this.view.requestMeasure(this.placeInfoReq);
  }
  updateSel() {
    let cState = this.view.state.field(this.stateField), open = cState.open;
    if (open.selected > -1 && open.selected < this.range.from || open.selected >= this.range.to) {
      this.range = rangeAroundSelected(open.options.length, open.selected, this.view.state.facet(completionConfig).maxRenderedOptions);
      this.list.remove();
      this.list = this.dom.appendChild(this.createListBox(open.options, cState.id, this.range));
      this.list.addEventListener("scroll", () => {
        if (this.info)
          this.view.requestMeasure(this.placeInfoReq);
      });
    }
    if (this.updateSelectedOption(open.selected)) {
      this.destroyInfo();
      let { completion } = open.options[open.selected];
      let { info } = completion;
      if (!info)
        return;
      let infoResult = typeof info === "string" ? document.createTextNode(info) : info(completion);
      if (!infoResult)
        return;
      if ("then" in infoResult) {
        infoResult.then((obj) => {
          if (obj && this.view.state.field(this.stateField, false) == cState)
            this.addInfoPane(obj, completion);
        }).catch((e) => logException(this.view.state, e, "completion info"));
      } else {
        this.addInfoPane(infoResult, completion);
      }
    }
  }
  addInfoPane(content2, completion) {
    this.destroyInfo();
    let wrap = this.info = document.createElement("div");
    wrap.className = "cm-tooltip cm-completionInfo";
    if (content2.nodeType != null) {
      wrap.appendChild(content2);
      this.infoDestroy = null;
    } else {
      let { dom, destroy } = content2;
      wrap.appendChild(dom);
      this.infoDestroy = destroy || null;
    }
    this.dom.appendChild(wrap);
    this.view.requestMeasure(this.placeInfoReq);
  }
  updateSelectedOption(selected) {
    let set = null;
    for (let opt = this.list.firstChild, i = this.range.from;opt; opt = opt.nextSibling, i++) {
      if (opt.nodeName != "LI" || !opt.id) {
        i--;
      } else if (i == selected) {
        if (!opt.hasAttribute("aria-selected")) {
          opt.setAttribute("aria-selected", "true");
          set = opt;
        }
      } else {
        if (opt.hasAttribute("aria-selected"))
          opt.removeAttribute("aria-selected");
      }
    }
    if (set)
      scrollIntoView2(this.list, set);
    return set;
  }
  measureInfo() {
    let sel = this.dom.querySelector("[aria-selected]");
    if (!sel || !this.info)
      return null;
    let listRect = this.dom.getBoundingClientRect();
    let infoRect = this.info.getBoundingClientRect();
    let selRect = sel.getBoundingClientRect();
    let space = this.space;
    if (!space) {
      let win = this.dom.ownerDocument.defaultView || window;
      space = { left: 0, top: 0, right: win.innerWidth, bottom: win.innerHeight };
    }
    if (selRect.top > Math.min(space.bottom, listRect.bottom) - 10 || selRect.bottom < Math.max(space.top, listRect.top) + 10)
      return null;
    return this.view.state.facet(completionConfig).positionInfo(this.view, listRect, selRect, infoRect, space);
  }
  placeInfo(pos) {
    if (this.info) {
      if (pos) {
        if (pos.style)
          this.info.style.cssText = pos.style;
        this.info.className = "cm-tooltip cm-completionInfo " + (pos.class || "");
      } else {
        this.info.style.cssText = "top: -1e6px";
      }
    }
  }
  createListBox(options, id, range) {
    const ul = document.createElement("ul");
    ul.id = id;
    ul.setAttribute("role", "listbox");
    ul.setAttribute("aria-expanded", "true");
    ul.setAttribute("aria-label", this.view.state.phrase("Completions"));
    let curSection = null;
    for (let i = range.from;i < range.to; i++) {
      let { completion, match } = options[i], { section } = completion;
      if (section) {
        let name2 = typeof section == "string" ? section : section.name;
        if (name2 != curSection && (i > range.from || range.from == 0)) {
          curSection = name2;
          if (typeof section != "string" && section.header) {
            ul.appendChild(section.header(section));
          } else {
            let header = ul.appendChild(document.createElement("completion-section"));
            header.textContent = name2;
          }
        }
      }
      const li = ul.appendChild(document.createElement("li"));
      li.id = id + "-" + i;
      li.setAttribute("role", "option");
      let cls = this.optionClass(completion);
      if (cls)
        li.className = cls;
      for (let source of this.optionContent) {
        let node = source(completion, this.view.state, match);
        if (node)
          li.appendChild(node);
      }
    }
    if (range.from)
      ul.classList.add("cm-completionListIncompleteTop");
    if (range.to < options.length)
      ul.classList.add("cm-completionListIncompleteBottom");
    return ul;
  }
  destroyInfo() {
    if (this.info) {
      if (this.infoDestroy)
        this.infoDestroy();
      this.info.remove();
      this.info = null;
    }
  }
  destroy() {
    this.destroyInfo();
  }
}

class CompletionDialog {
  constructor(options, attrs, tooltip, timestamp, selected, disabled) {
    this.options = options;
    this.attrs = attrs;
    this.tooltip = tooltip;
    this.timestamp = timestamp;
    this.selected = selected;
    this.disabled = disabled;
  }
  setSelected(selected, id) {
    return selected == this.selected || selected >= this.options.length ? this : new CompletionDialog(this.options, makeAttrs(id, selected), this.tooltip, this.timestamp, selected, this.disabled);
  }
  static build(active, state6, id, prev, conf) {
    let options = sortOptions(active, state6);
    if (!options.length) {
      return prev && active.some((a) => a.state == 1) ? new CompletionDialog(prev.options, prev.attrs, prev.tooltip, prev.timestamp, prev.selected, true) : null;
    }
    let selected = state6.facet(completionConfig).selectOnOpen ? 0 : -1;
    if (prev && prev.selected != selected && prev.selected != -1) {
      let selectedValue = prev.options[prev.selected].completion;
      for (let i = 0;i < options.length; i++)
        if (options[i].completion == selectedValue) {
          selected = i;
          break;
        }
    }
    return new CompletionDialog(options, makeAttrs(id, selected), {
      pos: active.reduce((a, b) => b.hasResult() ? Math.min(a, b.from) : a, 1e8),
      create: completionTooltip(completionState, applyCompletion),
      above: conf.aboveCursor
    }, prev ? prev.timestamp : Date.now(), selected, false);
  }
  map(changes) {
    return new CompletionDialog(this.options, this.attrs, Object.assign(Object.assign({}, this.tooltip), { pos: changes.mapPos(this.tooltip.pos) }), this.timestamp, this.selected, this.disabled);
  }
}

class CompletionState {
  constructor(active, id, open) {
    this.active = active;
    this.id = id;
    this.open = open;
  }
  static start() {
    return new CompletionState(none3, "cm-ac-" + Math.floor(Math.random() * 2000000).toString(36), null);
  }
  update(tr) {
    let { state: state6 } = tr, conf = state6.facet(completionConfig);
    let sources = conf.override || state6.languageDataAt("autocomplete", cur(state6)).map(asSource);
    let active = sources.map((source) => {
      let value = this.active.find((s) => s.source == source) || new ActiveSource(source, this.active.some((a) => a.state != 0) ? 1 : 0);
      return value.update(tr, conf);
    });
    if (active.length == this.active.length && active.every((a, i) => a == this.active[i]))
      active = this.active;
    let open = this.open;
    if (open && tr.docChanged)
      open = open.map(tr.changes);
    if (tr.selection || active.some((a) => a.hasResult() && tr.changes.touchesRange(a.from, a.to)) || !sameResults(active, this.active))
      open = CompletionDialog.build(active, state6, this.id, open, conf);
    else if (open && open.disabled && !active.some((a) => a.state == 1))
      open = null;
    if (!open && active.every((a) => a.state != 1) && active.some((a) => a.hasResult()))
      active = active.map((a) => a.hasResult() ? new ActiveSource(a.source, 0) : a);
    for (let effect of tr.effects)
      if (effect.is(setSelectedEffect))
        open = open && open.setSelected(effect.value, this.id);
    return active == this.active && open == this.open ? this : new CompletionState(active, this.id, open);
  }
  get tooltip() {
    return this.open ? this.open.tooltip : null;
  }
  get attrs() {
    return this.open ? this.open.attrs : baseAttrs;
  }
}
var baseAttrs = {
  "aria-autocomplete": "list"
};
var none3 = [];

class ActiveSource {
  constructor(source, state6, explicitPos = -1) {
    this.source = source;
    this.state = state6;
    this.explicitPos = explicitPos;
  }
  hasResult() {
    return false;
  }
  update(tr, conf) {
    let event = getUserEvent(tr), value = this;
    if (event)
      value = value.handleUserEvent(tr, event, conf);
    else if (tr.docChanged)
      value = value.handleChange(tr);
    else if (tr.selection && value.state != 0)
      value = new ActiveSource(value.source, 0);
    for (let effect of tr.effects) {
      if (effect.is(startCompletionEffect))
        value = new ActiveSource(value.source, 1, effect.value ? cur(tr.state) : -1);
      else if (effect.is(closeCompletionEffect))
        value = new ActiveSource(value.source, 0);
      else if (effect.is(setActiveEffect)) {
        for (let active of effect.value)
          if (active.source == value.source)
            value = active;
      }
    }
    return value;
  }
  handleUserEvent(tr, type, conf) {
    return type == "delete" || !conf.activateOnTyping ? this.map(tr.changes) : new ActiveSource(this.source, 1);
  }
  handleChange(tr) {
    return tr.changes.touchesRange(cur(tr.startState)) ? new ActiveSource(this.source, 0) : this.map(tr.changes);
  }
  map(changes) {
    return changes.empty || this.explicitPos < 0 ? this : new ActiveSource(this.source, this.state, changes.mapPos(this.explicitPos));
  }
}

class ActiveResult extends ActiveSource {
  constructor(source, explicitPos, result, from, to) {
    super(source, 2, explicitPos);
    this.result = result;
    this.from = from;
    this.to = to;
  }
  hasResult() {
    return true;
  }
  handleUserEvent(tr, type, conf) {
    var _a2;
    let from = tr.changes.mapPos(this.from), to = tr.changes.mapPos(this.to, 1);
    let pos = cur(tr.state);
    if ((this.explicitPos < 0 ? pos <= from : pos < this.from) || pos > to || type == "delete" && cur(tr.startState) == this.from)
      return new ActiveSource(this.source, type == "input" && conf.activateOnTyping ? 1 : 0);
    let explicitPos = this.explicitPos < 0 ? -1 : tr.changes.mapPos(this.explicitPos), updated;
    if (checkValid(this.result.validFor, tr.state, from, to))
      return new ActiveResult(this.source, explicitPos, this.result, from, to);
    if (this.result.update && (updated = this.result.update(this.result, from, to, new CompletionContext(tr.state, pos, explicitPos >= 0))))
      return new ActiveResult(this.source, explicitPos, updated, updated.from, (_a2 = updated.to) !== null && _a2 !== undefined ? _a2 : cur(tr.state));
    return new ActiveSource(this.source, 1, explicitPos);
  }
  handleChange(tr) {
    return tr.changes.touchesRange(this.from, this.to) ? new ActiveSource(this.source, 0) : this.map(tr.changes);
  }
  map(mapping) {
    return mapping.empty ? this : new ActiveResult(this.source, this.explicitPos < 0 ? -1 : mapping.mapPos(this.explicitPos), this.result, mapping.mapPos(this.from), mapping.mapPos(this.to, 1));
  }
}
var setActiveEffect = StateEffect.define({
  map(sources, mapping) {
    return sources.map((s) => s.map(mapping));
  }
});
var setSelectedEffect = StateEffect.define();
var completionState = StateField.define({
  create() {
    return CompletionState.start();
  },
  update(value, tr) {
    return value.update(tr);
  },
  provide: (f) => [
    showTooltip.from(f, (val) => val.tooltip),
    EditorView.contentAttributes.from(f, (state6) => state6.attrs)
  ]
});
var acceptCompletion = (view5) => {
  let cState = view5.state.field(completionState, false);
  if (view5.state.readOnly || !cState || !cState.open || cState.open.selected < 0 || cState.open.disabled || Date.now() - cState.open.timestamp < view5.state.facet(completionConfig).interactionDelay)
    return false;
  return applyCompletion(view5, cState.open.options[cState.open.selected]);
};
var startCompletion = (view5) => {
  let cState = view5.state.field(completionState, false);
  if (!cState)
    return false;
  view5.dispatch({ effects: startCompletionEffect.of(true) });
  return true;
};
var closeCompletion = (view5) => {
  let cState = view5.state.field(completionState, false);
  if (!cState || !cState.active.some((a) => a.state != 0))
    return false;
  view5.dispatch({ effects: closeCompletionEffect.of(null) });
  return true;
};

class RunningQuery {
  constructor(active, context) {
    this.active = active;
    this.context = context;
    this.time = Date.now();
    this.updates = [];
    this.done = undefined;
  }
}
var DebounceTime = 50;
var MaxUpdateCount = 50;
var MinAbortTime = 1000;
var completionPlugin = ViewPlugin.fromClass(class {
  constructor(view5) {
    this.view = view5;
    this.debounceUpdate = -1;
    this.running = [];
    this.debounceAccept = -1;
    this.composing = 0;
    for (let active of view5.state.field(completionState).active)
      if (active.state == 1)
        this.startQuery(active);
  }
  update(update) {
    let cState = update.state.field(completionState);
    if (!update.selectionSet && !update.docChanged && update.startState.field(completionState) == cState)
      return;
    let doesReset = update.transactions.some((tr) => {
      return (tr.selection || tr.docChanged) && !getUserEvent(tr);
    });
    for (let i = 0;i < this.running.length; i++) {
      let query = this.running[i];
      if (doesReset || query.updates.length + update.transactions.length > MaxUpdateCount && Date.now() - query.time > MinAbortTime) {
        for (let handler of query.context.abortListeners) {
          try {
            handler();
          } catch (e) {
            logException(this.view.state, e);
          }
        }
        query.context.abortListeners = null;
        this.running.splice(i--, 1);
      } else {
        query.updates.push(...update.transactions);
      }
    }
    if (this.debounceUpdate > -1)
      clearTimeout(this.debounceUpdate);
    this.debounceUpdate = cState.active.some((a) => a.state == 1 && !this.running.some((q) => q.active.source == a.source)) ? setTimeout(() => this.startUpdate(), DebounceTime) : -1;
    if (this.composing != 0)
      for (let tr of update.transactions) {
        if (getUserEvent(tr) == "input")
          this.composing = 2;
        else if (this.composing == 2 && tr.selection)
          this.composing = 3;
      }
  }
  startUpdate() {
    this.debounceUpdate = -1;
    let { state: state6 } = this.view, cState = state6.field(completionState);
    for (let active of cState.active) {
      if (active.state == 1 && !this.running.some((r) => r.active.source == active.source))
        this.startQuery(active);
    }
  }
  startQuery(active) {
    let { state: state6 } = this.view, pos = cur(state6);
    let context = new CompletionContext(state6, pos, active.explicitPos == pos);
    let pending = new RunningQuery(active, context);
    this.running.push(pending);
    Promise.resolve(active.source(context)).then((result) => {
      if (!pending.context.aborted) {
        pending.done = result || null;
        this.scheduleAccept();
      }
    }, (err) => {
      this.view.dispatch({ effects: closeCompletionEffect.of(null) });
      logException(this.view.state, err);
    });
  }
  scheduleAccept() {
    if (this.running.every((q) => q.done !== undefined))
      this.accept();
    else if (this.debounceAccept < 0)
      this.debounceAccept = setTimeout(() => this.accept(), DebounceTime);
  }
  accept() {
    var _a2;
    if (this.debounceAccept > -1)
      clearTimeout(this.debounceAccept);
    this.debounceAccept = -1;
    let updated = [];
    let conf = this.view.state.facet(completionConfig);
    for (let i = 0;i < this.running.length; i++) {
      let query = this.running[i];
      if (query.done === undefined)
        continue;
      this.running.splice(i--, 1);
      if (query.done) {
        let active = new ActiveResult(query.active.source, query.active.explicitPos, query.done, query.done.from, (_a2 = query.done.to) !== null && _a2 !== undefined ? _a2 : cur(query.updates.length ? query.updates[0].startState : this.view.state));
        for (let tr of query.updates)
          active = active.update(tr, conf);
        if (active.hasResult()) {
          updated.push(active);
          continue;
        }
      }
      let current = this.view.state.field(completionState).active.find((a) => a.source == query.active.source);
      if (current && current.state == 1) {
        if (query.done == null) {
          let active = new ActiveSource(query.active.source, 0);
          for (let tr of query.updates)
            active = active.update(tr, conf);
          if (active.state != 1)
            updated.push(active);
        } else {
          this.startQuery(current);
        }
      }
    }
    if (updated.length)
      this.view.dispatch({ effects: setActiveEffect.of(updated) });
  }
}, {
  eventHandlers: {
    blur(event) {
      let state6 = this.view.state.field(completionState, false);
      if (state6 && state6.tooltip && this.view.state.facet(completionConfig).closeOnBlur) {
        let dialog = state6.open && getTooltip(this.view, state6.open.tooltip);
        if (!dialog || !dialog.dom.contains(event.relatedTarget))
          this.view.dispatch({ effects: closeCompletionEffect.of(null) });
      }
    },
    compositionstart() {
      this.composing = 1;
    },
    compositionend() {
      if (this.composing == 3) {
        setTimeout(() => this.view.dispatch({ effects: startCompletionEffect.of(false) }), 20);
      }
      this.composing = 0;
    }
  }
});
var baseTheme4 = EditorView.baseTheme({
  ".cm-tooltip.cm-tooltip-autocomplete": {
    "& > ul": {
      fontFamily: "monospace",
      whiteSpace: "nowrap",
      overflow: "hidden auto",
      maxWidth_fallback: "700px",
      maxWidth: "min(700px, 95vw)",
      minWidth: "250px",
      maxHeight: "10em",
      height: "100%",
      listStyle: "none",
      margin: 0,
      padding: 0,
      "& > li, & > completion-section": {
        padding: "1px 3px",
        lineHeight: 1.2
      },
      "& > li": {
        overflowX: "hidden",
        textOverflow: "ellipsis",
        cursor: "pointer"
      },
      "& > completion-section": {
        display: "list-item",
        borderBottom: "1px solid silver",
        paddingLeft: "0.5em",
        opacity: 0.7
      }
    }
  },
  "&light .cm-tooltip-autocomplete ul li[aria-selected]": {
    background: "#17c",
    color: "white"
  },
  "&light .cm-tooltip-autocomplete-disabled ul li[aria-selected]": {
    background: "#777"
  },
  "&dark .cm-tooltip-autocomplete ul li[aria-selected]": {
    background: "#347",
    color: "white"
  },
  "&dark .cm-tooltip-autocomplete-disabled ul li[aria-selected]": {
    background: "#444"
  },
  ".cm-completionListIncompleteTop:before, .cm-completionListIncompleteBottom:after": {
    content: '"\xB7\xB7\xB7"',
    opacity: 0.5,
    display: "block",
    textAlign: "center"
  },
  ".cm-tooltip.cm-completionInfo": {
    position: "absolute",
    padding: "3px 9px",
    width: "max-content",
    maxWidth: `${400}px`,
    boxSizing: "border-box"
  },
  ".cm-completionInfo.cm-completionInfo-left": { right: "100%" },
  ".cm-completionInfo.cm-completionInfo-right": { left: "100%" },
  ".cm-completionInfo.cm-completionInfo-left-narrow": { right: `${30}px` },
  ".cm-completionInfo.cm-completionInfo-right-narrow": { left: `${30}px` },
  "&light .cm-snippetField": { backgroundColor: "#00000022" },
  "&dark .cm-snippetField": { backgroundColor: "#ffffff22" },
  ".cm-snippetFieldPosition": {
    verticalAlign: "text-top",
    width: 0,
    height: "1.15em",
    display: "inline-block",
    margin: "0 -0.7px -.7em",
    borderLeft: "1.4px dotted #888"
  },
  ".cm-completionMatchedText": {
    textDecoration: "underline"
  },
  ".cm-completionDetail": {
    marginLeft: "0.5em",
    fontStyle: "italic"
  },
  ".cm-completionIcon": {
    fontSize: "90%",
    width: ".8em",
    display: "inline-block",
    textAlign: "center",
    paddingRight: ".6em",
    opacity: "0.6",
    boxSizing: "content-box"
  },
  ".cm-completionIcon-function, .cm-completionIcon-method": {
    "&:after": { content: "'\u0192'" }
  },
  ".cm-completionIcon-class": {
    "&:after": { content: "'\u25CB'" }
  },
  ".cm-completionIcon-interface": {
    "&:after": { content: "'\u25CC'" }
  },
  ".cm-completionIcon-variable": {
    "&:after": { content: "'\uD835\uDC65'" }
  },
  ".cm-completionIcon-constant": {
    "&:after": { content: "'\uD835\uDC36'" }
  },
  ".cm-completionIcon-type": {
    "&:after": { content: "'\uD835\uDC61'" }
  },
  ".cm-completionIcon-enum": {
    "&:after": { content: "'\u222A'" }
  },
  ".cm-completionIcon-property": {
    "&:after": { content: "'\u25A1'" }
  },
  ".cm-completionIcon-keyword": {
    "&:after": { content: "'\uD83D\uDD11\uFE0E'" }
  },
  ".cm-completionIcon-namespace": {
    "&:after": { content: "'\u25A2'" }
  },
  ".cm-completionIcon-text": {
    "&:after": { content: "'abc'", fontSize: "50%", verticalAlign: "middle" }
  }
});

class FieldPos {
  constructor(field, line, from, to) {
    this.field = field;
    this.line = line;
    this.from = from;
    this.to = to;
  }
}

class FieldRange {
  constructor(field, from, to) {
    this.field = field;
    this.from = from;
    this.to = to;
  }
  map(changes) {
    let from = changes.mapPos(this.from, -1, MapMode.TrackDel);
    let to = changes.mapPos(this.to, 1, MapMode.TrackDel);
    return from == null || to == null ? null : new FieldRange(this.field, from, to);
  }
}

class Snippet {
  constructor(lines, fieldPositions) {
    this.lines = lines;
    this.fieldPositions = fieldPositions;
  }
  instantiate(state6, pos) {
    let text = [], lineStart = [pos];
    let lineObj = state6.doc.lineAt(pos), baseIndent = /^\s*/.exec(lineObj.text)[0];
    for (let line of this.lines) {
      if (text.length) {
        let indent = baseIndent, tabs = /^\t*/.exec(line)[0].length;
        for (let i = 0;i < tabs; i++)
          indent += state6.facet(indentUnit);
        lineStart.push(pos + indent.length - tabs);
        line = indent + line.slice(tabs);
      }
      text.push(line);
      pos += line.length + 1;
    }
    let ranges = this.fieldPositions.map((pos2) => new FieldRange(pos2.field, lineStart[pos2.line] + pos2.from, lineStart[pos2.line] + pos2.to));
    return { text, ranges };
  }
  static parse(template) {
    let fields = [];
    let lines = [], positions = [], m;
    for (let line of template.split(/\r\n?|\n/)) {
      while (m = /[#$]\{(?:(\d+)(?::([^}]*))?|([^}]*))\}/.exec(line)) {
        let seq = m[1] ? +m[1] : null, name2 = m[2] || m[3] || "", found = -1;
        for (let i = 0;i < fields.length; i++) {
          if (seq != null ? fields[i].seq == seq : name2 ? fields[i].name == name2 : false)
            found = i;
        }
        if (found < 0) {
          let i = 0;
          while (i < fields.length && (seq == null || fields[i].seq != null && fields[i].seq < seq))
            i++;
          fields.splice(i, 0, { seq, name: name2 });
          found = i;
          for (let pos of positions)
            if (pos.field >= found)
              pos.field++;
        }
        positions.push(new FieldPos(found, lines.length, m.index, m.index + name2.length));
        line = line.slice(0, m.index) + name2 + line.slice(m.index + m[0].length);
      }
      for (let esc;esc = /\\([{}])/.exec(line); ) {
        line = line.slice(0, esc.index) + esc[1] + line.slice(esc.index + esc[0].length);
        for (let pos of positions)
          if (pos.line == lines.length && pos.from > esc.index) {
            pos.from--;
            pos.to--;
          }
      }
      lines.push(line);
    }
    return new Snippet(lines, positions);
  }
}
var fieldMarker = Decoration.widget({ widget: new class extends WidgetType {
  toDOM() {
    let span = document.createElement("span");
    span.className = "cm-snippetFieldPosition";
    return span;
  }
  ignoreEvent() {
    return false;
  }
} });
var fieldRange = Decoration.mark({ class: "cm-snippetField" });

class ActiveSnippet {
  constructor(ranges, active) {
    this.ranges = ranges;
    this.active = active;
    this.deco = Decoration.set(ranges.map((r) => (r.from == r.to ? fieldMarker : fieldRange).range(r.from, r.to)));
  }
  map(changes) {
    let ranges = [];
    for (let r of this.ranges) {
      let mapped = r.map(changes);
      if (!mapped)
        return null;
      ranges.push(mapped);
    }
    return new ActiveSnippet(ranges, this.active);
  }
  selectionInsideField(sel) {
    return sel.ranges.every((range) => this.ranges.some((r) => r.field == this.active && r.from <= range.from && r.to >= range.to));
  }
}
var setActive = StateEffect.define({
  map(value, changes) {
    return value && value.map(changes);
  }
});
var moveToField = StateEffect.define();
var snippetState = StateField.define({
  create() {
    return null;
  },
  update(value, tr) {
    for (let effect of tr.effects) {
      if (effect.is(setActive))
        return effect.value;
      if (effect.is(moveToField) && value)
        return new ActiveSnippet(value.ranges, effect.value);
    }
    if (value && tr.docChanged)
      value = value.map(tr.changes);
    if (value && tr.selection && !value.selectionInsideField(tr.selection))
      value = null;
    return value;
  },
  provide: (f) => EditorView.decorations.from(f, (val) => val ? val.deco : Decoration.none)
});
var clearSnippet = ({ state: state6, dispatch }) => {
  let active = state6.field(snippetState, false);
  if (!active)
    return false;
  dispatch(state6.update({ effects: setActive.of(null) }));
  return true;
};
var nextSnippetField = moveField(1);
var prevSnippetField = moveField(-1);
var defaultSnippetKeymap = [
  { key: "Tab", run: nextSnippetField, shift: prevSnippetField },
  { key: "Escape", run: clearSnippet }
];
var snippetKeymap = Facet.define({
  combine(maps) {
    return maps.length ? maps[0] : defaultSnippetKeymap;
  }
});
var addSnippetKeymap = Prec.highest(keymap.compute([snippetKeymap], (state6) => state6.facet(snippetKeymap)));
var snippetPointerHandler = EditorView.domEventHandlers({
  mousedown(event, view5) {
    let active = view5.state.field(snippetState, false), pos;
    if (!active || (pos = view5.posAtCoords({ x: event.clientX, y: event.clientY })) == null)
      return false;
    let match = active.ranges.find((r) => r.from <= pos && r.to >= pos);
    if (!match || match.field == active.active)
      return false;
    view5.dispatch({
      selection: fieldSelection(active.ranges, match.field),
      effects: setActive.of(active.ranges.some((r) => r.field > match.field) ? new ActiveSnippet(active.ranges, match.field) : null)
    });
    return true;
  }
});
var defaults2 = {
  brackets: ["(", "[", "{", "'", '"'],
  before: ")]}:;>",
  stringPrefixes: []
};
var closeBracketEffect = StateEffect.define({
  map(value, mapping) {
    let mapped = mapping.mapPos(value, -1, MapMode.TrackAfter);
    return mapped == null ? undefined : mapped;
  }
});
var closedBracket = new class extends RangeValue {
};
closedBracket.startSide = 1;
closedBracket.endSide = -1;
var bracketState = StateField.define({
  create() {
    return RangeSet.empty;
  },
  update(value, tr) {
    if (tr.selection) {
      let lineStart = tr.state.doc.lineAt(tr.selection.main.head).from;
      let prevLineStart = tr.startState.doc.lineAt(tr.startState.selection.main.head).from;
      if (lineStart != tr.changes.mapPos(prevLineStart, -1))
        value = RangeSet.empty;
    }
    value = value.map(tr.changes);
    for (let effect of tr.effects)
      if (effect.is(closeBracketEffect))
        value = value.update({ add: [closedBracket.range(effect.value, effect.value + 1)] });
    return value;
  }
});
var definedClosing = "()[]{}<>";
var android = typeof navigator == "object" && /Android\b/.test(navigator.userAgent);
var inputHandler2 = EditorView.inputHandler.of((view5, from, to, insert2) => {
  if ((android ? view5.composing : view5.compositionStarted) || view5.state.readOnly)
    return false;
  let sel = view5.state.selection.main;
  if (insert2.length > 2 || insert2.length == 2 && codePointSize(codePointAt(insert2, 0)) == 1 || from != sel.from || to != sel.to)
    return false;
  let tr = insertBracket(view5.state, insert2);
  if (!tr)
    return false;
  view5.dispatch(tr);
  return true;
});
var deleteBracketPair = ({ state: state6, dispatch }) => {
  if (state6.readOnly)
    return false;
  let conf = config(state6, state6.selection.main.head);
  let tokens = conf.brackets || defaults2.brackets;
  let dont = null, changes = state6.changeByRange((range) => {
    if (range.empty) {
      let before = prevChar(state6.doc, range.head);
      for (let token of tokens) {
        if (token == before && nextChar(state6.doc, range.head) == closing(codePointAt(token, 0)))
          return {
            changes: { from: range.head - token.length, to: range.head + token.length },
            range: EditorSelection.cursor(range.head - token.length)
          };
      }
    }
    return { range: dont = range };
  });
  if (!dont)
    dispatch(state6.update(changes, { scrollIntoView: true, userEvent: "delete.backward" }));
  return !dont;
};
var closeBracketsKeymap = [
  { key: "Backspace", run: deleteBracketPair }
];
var completionKeymap = [
  { key: "Ctrl-Space", run: startCompletion },
  { key: "Escape", run: closeCompletion },
  { key: "ArrowDown", run: moveCompletionSelection(true) },
  { key: "ArrowUp", run: moveCompletionSelection(false) },
  { key: "PageDown", run: moveCompletionSelection(true, "page") },
  { key: "PageUp", run: moveCompletionSelection(false, "page") },
  { key: "Enter", run: acceptCompletion }
];
var completionKeymapExt = Prec.highest(keymap.computeN([completionConfig], (state6) => state6.facet(completionConfig).defaultKeymap ? [completionKeymap] : []));

// /home/ray/Code/diagramatics-site/node_modules/@codemirror/lint/dist/index.js
var findDiagnostic = function(diagnostics, diagnostic = null, after = 0) {
  let found = null;
  diagnostics.between(after, 1e9, (from, to, { spec }) => {
    if (diagnostic && spec.diagnostic != diagnostic)
      return;
    found = new SelectedDiagnostic(from, to, spec.diagnostic);
    return false;
  });
  return found;
};
var hideTooltip = function(tr, tooltip) {
  let line = tr.startState.doc.lineAt(tooltip.pos);
  return !!(tr.effects.some((e) => e.is(setDiagnosticsEffect)) || tr.changes.touchesRange(line.from, line.to));
};
var maybeEnableLint = function(state7, effects) {
  return state7.field(lintState, false) ? effects : effects.concat(StateEffect.appendConfig.of(lintExtensions));
};
var lintTooltip = function(view6, pos, side) {
  let { diagnostics } = view6.state.field(lintState);
  let found = [], stackStart = 200000000, stackEnd = 0;
  diagnostics.between(pos - (side < 0 ? 1 : 0), pos + (side > 0 ? 1 : 0), (from, to, { spec }) => {
    if (pos >= from && pos <= to && (from == to || (pos > from || side > 0) && (pos < to || side < 0))) {
      found.push(spec.diagnostic);
      stackStart = Math.min(from, stackStart);
      stackEnd = Math.max(to, stackEnd);
    }
  });
  let diagnosticFilter = view6.state.facet(lintConfig).tooltipFilter;
  if (diagnosticFilter)
    found = diagnosticFilter(found);
  if (!found.length)
    return null;
  return {
    pos: stackStart,
    end: stackEnd,
    above: view6.state.doc.lineAt(stackStart).to < stackEnd,
    create() {
      return { dom: diagnosticsTooltip(view6, found) };
    }
  };
};
var diagnosticsTooltip = function(view6, diagnostics) {
  return crelt("ul", { class: "cm-tooltip-lint" }, diagnostics.map((d) => renderDiagnostic(view6, d, false)));
};
var assignKeys = function(actions) {
  let assigned = [];
  if (actions)
    actions:
      for (let { name: name2 } of actions) {
        for (let i = 0;i < name2.length; i++) {
          let ch = name2[i];
          if (/[a-zA-Z]/.test(ch) && !assigned.some((c) => c.toLowerCase() == ch.toLowerCase())) {
            assigned.push(ch);
            continue actions;
          }
        }
        assigned.push("");
      }
  return assigned;
};
var renderDiagnostic = function(view6, diagnostic, inPanel) {
  var _a2;
  let keys2 = inPanel ? assignKeys(diagnostic.actions) : [];
  return crelt("li", { class: "cm-diagnostic cm-diagnostic-" + diagnostic.severity }, crelt("span", { class: "cm-diagnosticText" }, diagnostic.renderMessage ? diagnostic.renderMessage() : diagnostic.message), (_a2 = diagnostic.actions) === null || _a2 === undefined ? undefined : _a2.map((action, i) => {
    let fired = false, click = (e) => {
      e.preventDefault();
      if (fired)
        return;
      fired = true;
      let found = findDiagnostic(view6.state.field(lintState).diagnostics, diagnostic);
      if (found)
        action.apply(view6, found.from, found.to);
    };
    let { name: name2 } = action, keyIndex = keys2[i] ? name2.indexOf(keys2[i]) : -1;
    let nameElt = keyIndex < 0 ? name2 : [
      name2.slice(0, keyIndex),
      crelt("u", name2.slice(keyIndex, keyIndex + 1)),
      name2.slice(keyIndex + 1)
    ];
    return crelt("button", {
      type: "button",
      class: "cm-diagnosticAction",
      onclick: click,
      onmousedown: click,
      "aria-label": ` Action: ${name2}${keyIndex < 0 ? "" : ` (access key "${keys2[i]})"`}.`
    }, nameElt);
  }), diagnostic.source && crelt("div", { class: "cm-diagnosticSource" }, diagnostic.source));
};
var svg = function(content2, attrs = `viewBox="0 0 40 40"`) {
  return `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${encodeURIComponent(content2)}</svg>')`;
};
var underline = function(color) {
  return svg(`<path d="m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0" stroke="${color}" fill="none" stroke-width=".7"/>`, `width="6" height="3"`);
};
class SelectedDiagnostic {
  constructor(from, to, diagnostic) {
    this.from = from;
    this.to = to;
    this.diagnostic = diagnostic;
  }
}

class LintState {
  constructor(diagnostics, panel, selected) {
    this.diagnostics = diagnostics;
    this.panel = panel;
    this.selected = selected;
  }
  static init(diagnostics, panel, state7) {
    let markedDiagnostics = diagnostics;
    let diagnosticFilter = state7.facet(lintConfig).markerFilter;
    if (diagnosticFilter)
      markedDiagnostics = diagnosticFilter(markedDiagnostics);
    let ranges = Decoration.set(markedDiagnostics.map((d) => {
      return d.from == d.to || d.from == d.to - 1 && state7.doc.lineAt(d.from).to == d.from ? Decoration.widget({
        widget: new DiagnosticWidget(d),
        diagnostic: d
      }).range(d.from) : Decoration.mark({
        attributes: { class: "cm-lintRange cm-lintRange-" + d.severity + (d.markClass ? " " + d.markClass : "") },
        diagnostic: d
      }).range(d.from, d.to);
    }), true);
    return new LintState(ranges, panel, findDiagnostic(ranges));
  }
}
var setDiagnosticsEffect = StateEffect.define();
var togglePanel2 = StateEffect.define();
var movePanelSelection = StateEffect.define();
var lintState = StateField.define({
  create() {
    return new LintState(Decoration.none, null, null);
  },
  update(value, tr) {
    if (tr.docChanged) {
      let mapped = value.diagnostics.map(tr.changes), selected = null;
      if (value.selected) {
        let selPos = tr.changes.mapPos(value.selected.from, 1);
        selected = findDiagnostic(mapped, value.selected.diagnostic, selPos) || findDiagnostic(mapped, null, selPos);
      }
      value = new LintState(mapped, value.panel, selected);
    }
    for (let effect of tr.effects) {
      if (effect.is(setDiagnosticsEffect)) {
        value = LintState.init(effect.value, value.panel, tr.state);
      } else if (effect.is(togglePanel2)) {
        value = new LintState(value.diagnostics, effect.value ? LintPanel.open : null, value.selected);
      } else if (effect.is(movePanelSelection)) {
        value = new LintState(value.diagnostics, value.panel, effect.value);
      }
    }
    return value;
  },
  provide: (f) => [
    showPanel.from(f, (val) => val.panel),
    EditorView.decorations.from(f, (s) => s.diagnostics)
  ]
});
var activeMark = Decoration.mark({ class: "cm-lintRange cm-lintRange-active" });
var openLintPanel = (view6) => {
  let field = view6.state.field(lintState, false);
  if (!field || !field.panel)
    view6.dispatch({ effects: maybeEnableLint(view6.state, [togglePanel2.of(true)]) });
  let panel = getPanel(view6, LintPanel.open);
  if (panel)
    panel.dom.querySelector(".cm-panel-lint ul").focus();
  return true;
};
var closeLintPanel = (view6) => {
  let field = view6.state.field(lintState, false);
  if (!field || !field.panel)
    return false;
  view6.dispatch({ effects: togglePanel2.of(false) });
  return true;
};
var nextDiagnostic = (view6) => {
  let field = view6.state.field(lintState, false);
  if (!field)
    return false;
  let sel = view6.state.selection.main, next = field.diagnostics.iter(sel.to + 1);
  if (!next.value) {
    next = field.diagnostics.iter(0);
    if (!next.value || next.from == sel.from && next.to == sel.to)
      return false;
  }
  view6.dispatch({ selection: { anchor: next.from, head: next.to }, scrollIntoView: true });
  return true;
};
var lintKeymap = [
  { key: "Mod-Shift-m", run: openLintPanel, preventDefault: true },
  { key: "F8", run: nextDiagnostic }
];
var lintConfig = Facet.define({
  combine(input) {
    return Object.assign({ sources: input.map((i) => i.source) }, combineConfig(input.map((i) => i.config), {
      delay: 750,
      markerFilter: null,
      tooltipFilter: null,
      needsRefresh: null
    }, {
      needsRefresh: (a, b) => !a ? b : !b ? a : (u) => a(u) || b(u)
    }));
  }
});

class DiagnosticWidget extends WidgetType {
  constructor(diagnostic) {
    super();
    this.diagnostic = diagnostic;
  }
  eq(other) {
    return other.diagnostic == this.diagnostic;
  }
  toDOM() {
    return crelt("span", { class: "cm-lintPoint cm-lintPoint-" + this.diagnostic.severity });
  }
}

class PanelItem {
  constructor(view6, diagnostic) {
    this.diagnostic = diagnostic;
    this.id = "item_" + Math.floor(Math.random() * 4294967295).toString(16);
    this.dom = renderDiagnostic(view6, diagnostic, true);
    this.dom.id = this.id;
    this.dom.setAttribute("role", "option");
  }
}

class LintPanel {
  constructor(view6) {
    this.view = view6;
    this.items = [];
    let onkeydown = (event) => {
      if (event.keyCode == 27) {
        closeLintPanel(this.view);
        this.view.focus();
      } else if (event.keyCode == 38 || event.keyCode == 33) {
        this.moveSelection((this.selectedIndex - 1 + this.items.length) % this.items.length);
      } else if (event.keyCode == 40 || event.keyCode == 34) {
        this.moveSelection((this.selectedIndex + 1) % this.items.length);
      } else if (event.keyCode == 36) {
        this.moveSelection(0);
      } else if (event.keyCode == 35) {
        this.moveSelection(this.items.length - 1);
      } else if (event.keyCode == 13) {
        this.view.focus();
      } else if (event.keyCode >= 65 && event.keyCode <= 90 && this.selectedIndex >= 0) {
        let { diagnostic } = this.items[this.selectedIndex], keys2 = assignKeys(diagnostic.actions);
        for (let i = 0;i < keys2.length; i++)
          if (keys2[i].toUpperCase().charCodeAt(0) == event.keyCode) {
            let found = findDiagnostic(this.view.state.field(lintState).diagnostics, diagnostic);
            if (found)
              diagnostic.actions[i].apply(view6, found.from, found.to);
          }
      } else {
        return;
      }
      event.preventDefault();
    };
    let onclick = (event) => {
      for (let i = 0;i < this.items.length; i++) {
        if (this.items[i].dom.contains(event.target))
          this.moveSelection(i);
      }
    };
    this.list = crelt("ul", {
      tabIndex: 0,
      role: "listbox",
      "aria-label": this.view.state.phrase("Diagnostics"),
      onkeydown,
      onclick
    });
    this.dom = crelt("div", { class: "cm-panel-lint" }, this.list, crelt("button", {
      type: "button",
      name: "close",
      "aria-label": this.view.state.phrase("close"),
      onclick: () => closeLintPanel(this.view)
    }, "\xD7"));
    this.update();
  }
  get selectedIndex() {
    let selected = this.view.state.field(lintState).selected;
    if (!selected)
      return -1;
    for (let i = 0;i < this.items.length; i++)
      if (this.items[i].diagnostic == selected.diagnostic)
        return i;
    return -1;
  }
  update() {
    let { diagnostics, selected } = this.view.state.field(lintState);
    let i = 0, needsSync = false, newSelectedItem = null;
    diagnostics.between(0, this.view.state.doc.length, (_start, _end, { spec }) => {
      let found = -1, item;
      for (let j = i;j < this.items.length; j++)
        if (this.items[j].diagnostic == spec.diagnostic) {
          found = j;
          break;
        }
      if (found < 0) {
        item = new PanelItem(this.view, spec.diagnostic);
        this.items.splice(i, 0, item);
        needsSync = true;
      } else {
        item = this.items[found];
        if (found > i) {
          this.items.splice(i, found - i);
          needsSync = true;
        }
      }
      if (selected && item.diagnostic == selected.diagnostic) {
        if (!item.dom.hasAttribute("aria-selected")) {
          item.dom.setAttribute("aria-selected", "true");
          newSelectedItem = item;
        }
      } else if (item.dom.hasAttribute("aria-selected")) {
        item.dom.removeAttribute("aria-selected");
      }
      i++;
    });
    while (i < this.items.length && !(this.items.length == 1 && this.items[0].diagnostic.from < 0)) {
      needsSync = true;
      this.items.pop();
    }
    if (this.items.length == 0) {
      this.items.push(new PanelItem(this.view, {
        from: -1,
        to: -1,
        severity: "info",
        message: this.view.state.phrase("No diagnostics")
      }));
      needsSync = true;
    }
    if (newSelectedItem) {
      this.list.setAttribute("aria-activedescendant", newSelectedItem.id);
      this.view.requestMeasure({
        key: this,
        read: () => ({ sel: newSelectedItem.dom.getBoundingClientRect(), panel: this.list.getBoundingClientRect() }),
        write: ({ sel, panel }) => {
          if (sel.top < panel.top)
            this.list.scrollTop -= panel.top - sel.top;
          else if (sel.bottom > panel.bottom)
            this.list.scrollTop += sel.bottom - panel.bottom;
        }
      });
    } else if (this.selectedIndex < 0) {
      this.list.removeAttribute("aria-activedescendant");
    }
    if (needsSync)
      this.sync();
  }
  sync() {
    let domPos = this.list.firstChild;
    function rm2() {
      let prev = domPos;
      domPos = prev.nextSibling;
      prev.remove();
    }
    for (let item of this.items) {
      if (item.dom.parentNode == this.list) {
        while (domPos != item.dom)
          rm2();
        domPos = item.dom.nextSibling;
      } else {
        this.list.insertBefore(item.dom, domPos);
      }
    }
    while (domPos)
      rm2();
  }
  moveSelection(selectedIndex) {
    if (this.selectedIndex < 0)
      return;
    let field = this.view.state.field(lintState);
    let selection = findDiagnostic(field.diagnostics, this.items[selectedIndex].diagnostic);
    if (!selection)
      return;
    this.view.dispatch({
      selection: { anchor: selection.from, head: selection.to },
      scrollIntoView: true,
      effects: movePanelSelection.of(selection)
    });
  }
  static open(view6) {
    return new LintPanel(view6);
  }
}
var baseTheme5 = EditorView.baseTheme({
  ".cm-diagnostic": {
    padding: "3px 6px 3px 8px",
    marginLeft: "-1px",
    display: "block",
    whiteSpace: "pre-wrap"
  },
  ".cm-diagnostic-error": { borderLeft: "5px solid #d11" },
  ".cm-diagnostic-warning": { borderLeft: "5px solid orange" },
  ".cm-diagnostic-info": { borderLeft: "5px solid #999" },
  ".cm-diagnostic-hint": { borderLeft: "5px solid #66d" },
  ".cm-diagnosticAction": {
    font: "inherit",
    border: "none",
    padding: "2px 4px",
    backgroundColor: "#444",
    color: "white",
    borderRadius: "3px",
    marginLeft: "8px",
    cursor: "pointer"
  },
  ".cm-diagnosticSource": {
    fontSize: "70%",
    opacity: 0.7
  },
  ".cm-lintRange": {
    backgroundPosition: "left bottom",
    backgroundRepeat: "repeat-x",
    paddingBottom: "0.7px"
  },
  ".cm-lintRange-error": { backgroundImage: underline("#d11") },
  ".cm-lintRange-warning": { backgroundImage: underline("orange") },
  ".cm-lintRange-info": { backgroundImage: underline("#999") },
  ".cm-lintRange-hint": { backgroundImage: underline("#66d") },
  ".cm-lintRange-active": { backgroundColor: "#ffdd9980" },
  ".cm-tooltip-lint": {
    padding: 0,
    margin: 0
  },
  ".cm-lintPoint": {
    position: "relative",
    "&:after": {
      content: '""',
      position: "absolute",
      bottom: 0,
      left: "-2px",
      borderLeft: "3px solid transparent",
      borderRight: "3px solid transparent",
      borderBottom: "4px solid #d11"
    }
  },
  ".cm-lintPoint-warning": {
    "&:after": { borderBottomColor: "orange" }
  },
  ".cm-lintPoint-info": {
    "&:after": { borderBottomColor: "#999" }
  },
  ".cm-lintPoint-hint": {
    "&:after": { borderBottomColor: "#66d" }
  },
  ".cm-panel.cm-panel-lint": {
    position: "relative",
    "& ul": {
      maxHeight: "100px",
      overflowY: "auto",
      "& [aria-selected]": {
        backgroundColor: "#ddd",
        "& u": { textDecoration: "underline" }
      },
      "&:focus [aria-selected]": {
        background_fallback: "#bdf",
        backgroundColor: "Highlight",
        color_fallback: "white",
        color: "HighlightText"
      },
      "& u": { textDecoration: "none" },
      padding: 0,
      margin: 0
    },
    "& [name=close]": {
      position: "absolute",
      top: "0",
      right: "2px",
      background: "inherit",
      border: "none",
      font: "inherit",
      padding: 0,
      margin: 0
    }
  }
});
var lintExtensions = [
  lintState,
  EditorView.decorations.compute([lintState], (state7) => {
    let { selected, panel } = state7.field(lintState);
    return !selected || !panel || selected.from == selected.to ? Decoration.none : Decoration.set([
      activeMark.range(selected.from, selected.to)
    ]);
  }),
  hoverTooltip(lintTooltip, { hideOn: hideTooltip }),
  baseTheme5
];

// /home/ray/Code/diagramatics-site/node_modules/codemirror/dist/index.js
var basicSetup = (() => [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...lintKeymap
  ])
])();

// /home/ray/Code/diagramatics-site/node_modules/@lezer/lr/dist/index.js
var decodeArray = function(input, Type = Uint16Array) {
  if (typeof input != "string")
    return input;
  let array = null;
  for (let pos = 0, out = 0;pos < input.length; ) {
    let value = 0;
    for (;; ) {
      let next = input.charCodeAt(pos++), stop = false;
      if (next == 126) {
        value = 65535;
        break;
      }
      if (next >= 92)
        next--;
      if (next >= 34)
        next--;
      let digit = next - 32;
      if (digit >= 46) {
        digit -= 46;
        stop = true;
      }
      value += digit;
      if (stop)
        break;
      value *= 46;
    }
    if (array)
      array[out++] = value;
    else
      array = new Type(value);
  }
  return array;
};
var readToken = function(data, input, stack, group, precTable, precOffset) {
  let state8 = 0, groupMask = 1 << group, { dialect } = stack.p.parser;
  scan:
    for (;; ) {
      if ((groupMask & data[state8]) == 0)
        break;
      let accEnd = data[state8 + 1];
      for (let i = state8 + 3;i < accEnd; i += 2)
        if ((data[i + 1] & groupMask) > 0) {
          let term = data[i];
          if (dialect.allows(term) && (input.token.value == -1 || input.token.value == term || overrides(term, input.token.value, precTable, precOffset))) {
            input.acceptToken(term);
            break;
          }
        }
      let next = input.next, low = 0, high = data[state8 + 2];
      if (input.next < 0 && high > low && data[accEnd + high * 3 - 3] == 65535 && data[accEnd + high * 3 - 3] == 65535) {
        state8 = data[accEnd + high * 3 - 1];
        continue scan;
      }
      for (;low < high; ) {
        let mid = low + high >> 1;
        let index = accEnd + mid + (mid << 1);
        let from = data[index], to = data[index + 1] || 65536;
        if (next < from)
          high = mid;
        else if (next >= to)
          low = mid + 1;
        else {
          state8 = data[index + 2];
          input.advance();
          continue scan;
        }
      }
      break;
    }
};
var findOffset = function(data, start, term) {
  for (let i = start, next;(next = data[i]) != 65535; i++)
    if (next == term)
      return i - start;
  return -1;
};
var overrides = function(token, prev, tableData, tableOffset) {
  let iPrev = findOffset(tableData, tableOffset, prev);
  return iPrev < 0 || findOffset(tableData, tableOffset, token) < iPrev;
};
var cutAt = function(tree, pos, side) {
  let cursor = tree.cursor(IterMode.IncludeAnonymous);
  cursor.moveTo(pos);
  for (;; ) {
    if (!(side < 0 ? cursor.childBefore(pos) : cursor.childAfter(pos)))
      for (;; ) {
        if ((side < 0 ? cursor.to < pos : cursor.from > pos) && !cursor.type.isError)
          return side < 0 ? Math.max(0, Math.min(cursor.to - 1, pos - 25)) : Math.min(tree.length, Math.max(cursor.from + 1, pos + 25));
        if (side < 0 ? cursor.prevSibling() : cursor.nextSibling())
          break;
        if (!cursor.parent())
          return side < 0 ? 0 : tree.length;
      }
  }
};
var pushStackDedup = function(stack, newStacks) {
  for (let i = 0;i < newStacks.length; i++) {
    let other = newStacks[i];
    if (other.pos == stack.pos && other.sameState(stack)) {
      if (newStacks[i].score < stack.score)
        newStacks[i] = stack;
      return;
    }
  }
  newStacks.push(stack);
};
var pair = function(data, off) {
  return data[off] | data[off + 1] << 16;
};
var findFinished = function(stacks) {
  let best = null;
  for (let stack of stacks) {
    let stopped = stack.p.stoppedAt;
    if ((stack.pos == stack.p.stream.end || stopped != null && stack.pos > stopped) && stack.p.parser.stateFlag(stack.state, 2) && (!best || best.score < stack.score))
      best = stack;
  }
  return best;
};
var getSpecializer = function(spec) {
  if (spec.external) {
    let mask = spec.extend ? 1 : 0;
    return (value, stack) => spec.external(value, stack) << 1 | mask;
  }
  return spec.get;
};

class Stack {
  constructor(p, stack, state8, reducePos, pos, score2, buffer, bufferBase, curContext, lookAhead = 0, parent) {
    this.p = p;
    this.stack = stack;
    this.state = state8;
    this.reducePos = reducePos;
    this.pos = pos;
    this.score = score2;
    this.buffer = buffer;
    this.bufferBase = bufferBase;
    this.curContext = curContext;
    this.lookAhead = lookAhead;
    this.parent = parent;
  }
  toString() {
    return `[${this.stack.filter((_, i) => i % 3 == 0).concat(this.state)}]@${this.pos}${this.score ? "!" + this.score : ""}`;
  }
  static start(p, state8, pos = 0) {
    let cx = p.parser.context;
    return new Stack(p, [], state8, pos, pos, 0, [], 0, cx ? new StackContext(cx, cx.start) : null, 0, null);
  }
  get context() {
    return this.curContext ? this.curContext.context : null;
  }
  pushState(state8, start) {
    this.stack.push(this.state, start, this.bufferBase + this.buffer.length);
    this.state = state8;
  }
  reduce(action) {
    var _a2;
    let depth = action >> 19, type = action & 65535;
    let { parser } = this.p;
    let dPrec = parser.dynamicPrecedence(type);
    if (dPrec)
      this.score += dPrec;
    if (depth == 0) {
      this.pushState(parser.getGoto(this.state, type, true), this.reducePos);
      if (type < parser.minRepeatTerm)
        this.storeNode(type, this.reducePos, this.reducePos, 4, true);
      this.reduceContext(type, this.reducePos);
      return;
    }
    let base2 = this.stack.length - (depth - 1) * 3 - (action & 262144 ? 6 : 0);
    let start = base2 ? this.stack[base2 - 2] : this.p.ranges[0].from, size = this.reducePos - start;
    if (size >= 2000 && !((_a2 = this.p.parser.nodeSet.types[type]) === null || _a2 === undefined ? undefined : _a2.isAnonymous)) {
      if (start == this.p.lastBigReductionStart) {
        this.p.bigReductionCount++;
        this.p.lastBigReductionSize = size;
      } else if (this.p.lastBigReductionSize < size) {
        this.p.bigReductionCount = 1;
        this.p.lastBigReductionStart = start;
        this.p.lastBigReductionSize = size;
      }
    }
    let bufferBase = base2 ? this.stack[base2 - 1] : 0, count = this.bufferBase + this.buffer.length - bufferBase;
    if (type < parser.minRepeatTerm || action & 131072) {
      let pos = parser.stateFlag(this.state, 1) ? this.pos : this.reducePos;
      this.storeNode(type, start, pos, count + 4, true);
    }
    if (action & 262144) {
      this.state = this.stack[base2];
    } else {
      let baseStateID = this.stack[base2 - 3];
      this.state = parser.getGoto(baseStateID, type, true);
    }
    while (this.stack.length > base2)
      this.stack.pop();
    this.reduceContext(type, start);
  }
  storeNode(term, start, end, size = 4, isReduce = false) {
    if (term == 0 && (!this.stack.length || this.stack[this.stack.length - 1] < this.buffer.length + this.bufferBase)) {
      let cur2 = this, top2 = this.buffer.length;
      if (top2 == 0 && cur2.parent) {
        top2 = cur2.bufferBase - cur2.parent.bufferBase;
        cur2 = cur2.parent;
      }
      if (top2 > 0 && cur2.buffer[top2 - 4] == 0 && cur2.buffer[top2 - 1] > -1) {
        if (start == end)
          return;
        if (cur2.buffer[top2 - 2] >= start) {
          cur2.buffer[top2 - 2] = end;
          return;
        }
      }
    }
    if (!isReduce || this.pos == end) {
      this.buffer.push(term, start, end, size);
    } else {
      let index = this.buffer.length;
      if (index > 0 && this.buffer[index - 4] != 0)
        while (index > 0 && this.buffer[index - 2] > end) {
          this.buffer[index] = this.buffer[index - 4];
          this.buffer[index + 1] = this.buffer[index - 3];
          this.buffer[index + 2] = this.buffer[index - 2];
          this.buffer[index + 3] = this.buffer[index - 1];
          index -= 4;
          if (size > 4)
            size -= 4;
        }
      this.buffer[index] = term;
      this.buffer[index + 1] = start;
      this.buffer[index + 2] = end;
      this.buffer[index + 3] = size;
    }
  }
  shift(action, next, nextEnd) {
    let start = this.pos;
    if (action & 131072) {
      this.pushState(action & 65535, this.pos);
    } else if ((action & 262144) == 0) {
      let nextState = action, { parser } = this.p;
      if (nextEnd > this.pos || next <= parser.maxNode) {
        this.pos = nextEnd;
        if (!parser.stateFlag(nextState, 1))
          this.reducePos = nextEnd;
      }
      this.pushState(nextState, start);
      this.shiftContext(next, start);
      if (next <= parser.maxNode)
        this.buffer.push(next, start, nextEnd, 4);
    } else {
      this.pos = nextEnd;
      this.shiftContext(next, start);
      if (next <= this.p.parser.maxNode)
        this.buffer.push(next, start, nextEnd, 4);
    }
  }
  apply(action, next, nextEnd) {
    if (action & 65536)
      this.reduce(action);
    else
      this.shift(action, next, nextEnd);
  }
  useNode(value, next) {
    let index = this.p.reused.length - 1;
    if (index < 0 || this.p.reused[index] != value) {
      this.p.reused.push(value);
      index++;
    }
    let start = this.pos;
    this.reducePos = this.pos = start + value.length;
    this.pushState(next, start);
    this.buffer.push(index, start, this.reducePos, -1);
    if (this.curContext)
      this.updateContext(this.curContext.tracker.reuse(this.curContext.context, value, this, this.p.stream.reset(this.pos - value.length)));
  }
  split() {
    let parent = this;
    let off = parent.buffer.length;
    while (off > 0 && parent.buffer[off - 2] > parent.reducePos)
      off -= 4;
    let buffer = parent.buffer.slice(off), base2 = parent.bufferBase + off;
    while (parent && base2 == parent.bufferBase)
      parent = parent.parent;
    return new Stack(this.p, this.stack.slice(), this.state, this.reducePos, this.pos, this.score, buffer, base2, this.curContext, this.lookAhead, parent);
  }
  recoverByDelete(next, nextEnd) {
    let isNode = next <= this.p.parser.maxNode;
    if (isNode)
      this.storeNode(next, this.pos, nextEnd, 4);
    this.storeNode(0, this.pos, nextEnd, isNode ? 8 : 4);
    this.pos = this.reducePos = nextEnd;
    this.score -= 190;
  }
  canShift(term) {
    for (let sim = new SimulatedStack(this);; ) {
      let action = this.p.parser.stateSlot(sim.state, 4) || this.p.parser.hasAction(sim.state, term);
      if (action == 0)
        return false;
      if ((action & 65536) == 0)
        return true;
      sim.reduce(action);
    }
  }
  recoverByInsert(next) {
    if (this.stack.length >= 300)
      return [];
    let nextStates = this.p.parser.nextStates(this.state);
    if (nextStates.length > 4 << 1 || this.stack.length >= 120) {
      let best = [];
      for (let i = 0, s;i < nextStates.length; i += 2) {
        if ((s = nextStates[i + 1]) != this.state && this.p.parser.hasAction(s, next))
          best.push(nextStates[i], s);
      }
      if (this.stack.length < 120)
        for (let i = 0;best.length < 4 << 1 && i < nextStates.length; i += 2) {
          let s = nextStates[i + 1];
          if (!best.some((v, i2) => i2 & 1 && v == s))
            best.push(nextStates[i], s);
        }
      nextStates = best;
    }
    let result = [];
    for (let i = 0;i < nextStates.length && result.length < 4; i += 2) {
      let s = nextStates[i + 1];
      if (s == this.state)
        continue;
      let stack = this.split();
      stack.pushState(s, this.pos);
      stack.storeNode(0, stack.pos, stack.pos, 4, true);
      stack.shiftContext(nextStates[i], this.pos);
      stack.score -= 200;
      result.push(stack);
    }
    return result;
  }
  forceReduce() {
    let { parser } = this.p;
    let reduce = parser.stateSlot(this.state, 5);
    if ((reduce & 65536) == 0)
      return false;
    if (!parser.validAction(this.state, reduce)) {
      let depth = reduce >> 19, term = reduce & 65535;
      let target = this.stack.length - depth * 3;
      if (target < 0 || parser.getGoto(this.stack[target], term, false) < 0) {
        let backup = this.findForcedReduction();
        if (backup == null)
          return false;
        reduce = backup;
      }
      this.storeNode(0, this.pos, this.pos, 4, true);
      this.score -= 100;
    }
    this.reducePos = this.pos;
    this.reduce(reduce);
    return true;
  }
  findForcedReduction() {
    let { parser } = this.p, seen = [];
    let explore = (state8, depth) => {
      if (seen.includes(state8))
        return;
      seen.push(state8);
      return parser.allActions(state8, (action) => {
        if (action & (262144 | 131072))
          ;
        else if (action & 65536) {
          let rDepth = (action >> 19) - depth;
          if (rDepth > 1) {
            let term = action & 65535, target = this.stack.length - rDepth * 3;
            if (target >= 0 && parser.getGoto(this.stack[target], term, false) >= 0)
              return rDepth << 19 | 65536 | term;
          }
        } else {
          let found = explore(action, depth + 1);
          if (found != null)
            return found;
        }
      });
    };
    return explore(this.state, 0);
  }
  forceAll() {
    while (!this.p.parser.stateFlag(this.state, 2)) {
      if (!this.forceReduce()) {
        this.storeNode(0, this.pos, this.pos, 4, true);
        break;
      }
    }
    return this;
  }
  get deadEnd() {
    if (this.stack.length != 3)
      return false;
    let { parser } = this.p;
    return parser.data[parser.stateSlot(this.state, 1)] == 65535 && !parser.stateSlot(this.state, 4);
  }
  restart() {
    this.state = this.stack[0];
    this.stack.length = 0;
  }
  sameState(other) {
    if (this.state != other.state || this.stack.length != other.stack.length)
      return false;
    for (let i = 0;i < this.stack.length; i += 3)
      if (this.stack[i] != other.stack[i])
        return false;
    return true;
  }
  get parser() {
    return this.p.parser;
  }
  dialectEnabled(dialectID) {
    return this.p.parser.dialect.flags[dialectID];
  }
  shiftContext(term, start) {
    if (this.curContext)
      this.updateContext(this.curContext.tracker.shift(this.curContext.context, term, this, this.p.stream.reset(start)));
  }
  reduceContext(term, start) {
    if (this.curContext)
      this.updateContext(this.curContext.tracker.reduce(this.curContext.context, term, this, this.p.stream.reset(start)));
  }
  emitContext() {
    let last = this.buffer.length - 1;
    if (last < 0 || this.buffer[last] != -3)
      this.buffer.push(this.curContext.hash, this.pos, this.pos, -3);
  }
  emitLookAhead() {
    let last = this.buffer.length - 1;
    if (last < 0 || this.buffer[last] != -4)
      this.buffer.push(this.lookAhead, this.pos, this.pos, -4);
  }
  updateContext(context) {
    if (context != this.curContext.context) {
      let newCx = new StackContext(this.curContext.tracker, context);
      if (newCx.hash != this.curContext.hash)
        this.emitContext();
      this.curContext = newCx;
    }
  }
  setLookAhead(lookAhead) {
    if (lookAhead > this.lookAhead) {
      this.emitLookAhead();
      this.lookAhead = lookAhead;
    }
  }
  close() {
    if (this.curContext && this.curContext.tracker.strict)
      this.emitContext();
    if (this.lookAhead > 0)
      this.emitLookAhead();
  }
}

class StackContext {
  constructor(tracker, context) {
    this.tracker = tracker;
    this.context = context;
    this.hash = tracker.strict ? tracker.hash(context) : 0;
  }
}

class SimulatedStack {
  constructor(start) {
    this.start = start;
    this.state = start.state;
    this.stack = start.stack;
    this.base = this.stack.length;
  }
  reduce(action) {
    let term = action & 65535, depth = action >> 19;
    if (depth == 0) {
      if (this.stack == this.start.stack)
        this.stack = this.stack.slice();
      this.stack.push(this.state, 0, 0);
      this.base += 3;
    } else {
      this.base -= (depth - 1) * 3;
    }
    let goto = this.start.p.parser.getGoto(this.stack[this.base - 3], term, true);
    this.state = goto;
  }
}

class StackBufferCursor {
  constructor(stack, pos, index) {
    this.stack = stack;
    this.pos = pos;
    this.index = index;
    this.buffer = stack.buffer;
    if (this.index == 0)
      this.maybeNext();
  }
  static create(stack, pos = stack.bufferBase + stack.buffer.length) {
    return new StackBufferCursor(stack, pos, pos - stack.bufferBase);
  }
  maybeNext() {
    let next = this.stack.parent;
    if (next != null) {
      this.index = this.stack.bufferBase - next.bufferBase;
      this.stack = next;
      this.buffer = next.buffer;
    }
  }
  get id() {
    return this.buffer[this.index - 4];
  }
  get start() {
    return this.buffer[this.index - 3];
  }
  get end() {
    return this.buffer[this.index - 2];
  }
  get size() {
    return this.buffer[this.index - 1];
  }
  next() {
    this.index -= 4;
    this.pos -= 4;
    if (this.index == 0)
      this.maybeNext();
  }
  fork() {
    return new StackBufferCursor(this.stack, this.pos, this.index);
  }
}

class CachedToken {
  constructor() {
    this.start = -1;
    this.value = -1;
    this.end = -1;
    this.extended = -1;
    this.lookAhead = 0;
    this.mask = 0;
    this.context = 0;
  }
}
var nullToken = new CachedToken;

class InputStream {
  constructor(input, ranges) {
    this.input = input;
    this.ranges = ranges;
    this.chunk = "";
    this.chunkOff = 0;
    this.chunk2 = "";
    this.chunk2Pos = 0;
    this.next = -1;
    this.token = nullToken;
    this.rangeIndex = 0;
    this.pos = this.chunkPos = ranges[0].from;
    this.range = ranges[0];
    this.end = ranges[ranges.length - 1].to;
    this.readNext();
  }
  resolveOffset(offset, assoc) {
    let range = this.range, index = this.rangeIndex;
    let pos = this.pos + offset;
    while (pos < range.from) {
      if (!index)
        return null;
      let next = this.ranges[--index];
      pos -= range.from - next.to;
      range = next;
    }
    while (assoc < 0 ? pos > range.to : pos >= range.to) {
      if (index == this.ranges.length - 1)
        return null;
      let next = this.ranges[++index];
      pos += next.from - range.to;
      range = next;
    }
    return pos;
  }
  clipPos(pos) {
    if (pos >= this.range.from && pos < this.range.to)
      return pos;
    for (let range of this.ranges)
      if (range.to > pos)
        return Math.max(pos, range.from);
    return this.end;
  }
  peek(offset) {
    let idx = this.chunkOff + offset, pos, result;
    if (idx >= 0 && idx < this.chunk.length) {
      pos = this.pos + offset;
      result = this.chunk.charCodeAt(idx);
    } else {
      let resolved = this.resolveOffset(offset, 1);
      if (resolved == null)
        return -1;
      pos = resolved;
      if (pos >= this.chunk2Pos && pos < this.chunk2Pos + this.chunk2.length) {
        result = this.chunk2.charCodeAt(pos - this.chunk2Pos);
      } else {
        let i = this.rangeIndex, range = this.range;
        while (range.to <= pos)
          range = this.ranges[++i];
        this.chunk2 = this.input.chunk(this.chunk2Pos = pos);
        if (pos + this.chunk2.length > range.to)
          this.chunk2 = this.chunk2.slice(0, range.to - pos);
        result = this.chunk2.charCodeAt(0);
      }
    }
    if (pos >= this.token.lookAhead)
      this.token.lookAhead = pos + 1;
    return result;
  }
  acceptToken(token, endOffset = 0) {
    let end = endOffset ? this.resolveOffset(endOffset, -1) : this.pos;
    if (end == null || end < this.token.start)
      throw new RangeError("Token end out of bounds");
    this.token.value = token;
    this.token.end = end;
  }
  getChunk() {
    if (this.pos >= this.chunk2Pos && this.pos < this.chunk2Pos + this.chunk2.length) {
      let { chunk, chunkPos } = this;
      this.chunk = this.chunk2;
      this.chunkPos = this.chunk2Pos;
      this.chunk2 = chunk;
      this.chunk2Pos = chunkPos;
      this.chunkOff = this.pos - this.chunkPos;
    } else {
      this.chunk2 = this.chunk;
      this.chunk2Pos = this.chunkPos;
      let nextChunk = this.input.chunk(this.pos);
      let end = this.pos + nextChunk.length;
      this.chunk = end > this.range.to ? nextChunk.slice(0, this.range.to - this.pos) : nextChunk;
      this.chunkPos = this.pos;
      this.chunkOff = 0;
    }
  }
  readNext() {
    if (this.chunkOff >= this.chunk.length) {
      this.getChunk();
      if (this.chunkOff == this.chunk.length)
        return this.next = -1;
    }
    return this.next = this.chunk.charCodeAt(this.chunkOff);
  }
  advance(n = 1) {
    this.chunkOff += n;
    while (this.pos + n >= this.range.to) {
      if (this.rangeIndex == this.ranges.length - 1)
        return this.setDone();
      n -= this.range.to - this.pos;
      this.range = this.ranges[++this.rangeIndex];
      this.pos = this.range.from;
    }
    this.pos += n;
    if (this.pos >= this.token.lookAhead)
      this.token.lookAhead = this.pos + 1;
    return this.readNext();
  }
  setDone() {
    this.pos = this.chunkPos = this.end;
    this.range = this.ranges[this.rangeIndex = this.ranges.length - 1];
    this.chunk = "";
    return this.next = -1;
  }
  reset(pos, token) {
    if (token) {
      this.token = token;
      token.start = pos;
      token.lookAhead = pos + 1;
      token.value = token.extended = -1;
    } else {
      this.token = nullToken;
    }
    if (this.pos != pos) {
      this.pos = pos;
      if (pos == this.end) {
        this.setDone();
        return this;
      }
      while (pos < this.range.from)
        this.range = this.ranges[--this.rangeIndex];
      while (pos >= this.range.to)
        this.range = this.ranges[++this.rangeIndex];
      if (pos >= this.chunkPos && pos < this.chunkPos + this.chunk.length) {
        this.chunkOff = pos - this.chunkPos;
      } else {
        this.chunk = "";
        this.chunkOff = 0;
      }
      this.readNext();
    }
    return this;
  }
  read(from, to) {
    if (from >= this.chunkPos && to <= this.chunkPos + this.chunk.length)
      return this.chunk.slice(from - this.chunkPos, to - this.chunkPos);
    if (from >= this.chunk2Pos && to <= this.chunk2Pos + this.chunk2.length)
      return this.chunk2.slice(from - this.chunk2Pos, to - this.chunk2Pos);
    if (from >= this.range.from && to <= this.range.to)
      return this.input.read(from, to);
    let result = "";
    for (let r of this.ranges) {
      if (r.from >= to)
        break;
      if (r.to > from)
        result += this.input.read(Math.max(r.from, from), Math.min(r.to, to));
    }
    return result;
  }
}

class TokenGroup {
  constructor(data, id) {
    this.data = data;
    this.id = id;
  }
  token(input, stack) {
    let { parser } = stack.p;
    readToken(this.data, input, stack, this.id, parser.data, parser.tokenPrecTable);
  }
}
TokenGroup.prototype.contextual = TokenGroup.prototype.fallback = TokenGroup.prototype.extend = false;

class LocalTokenGroup {
  constructor(data, precTable, elseToken) {
    this.precTable = precTable;
    this.elseToken = elseToken;
    this.data = typeof data == "string" ? decodeArray(data) : data;
  }
  token(input, stack) {
    let start = input.pos, skipped = 0;
    for (;; ) {
      let atEof = input.next < 0, nextPos = input.resolveOffset(1, 1);
      readToken(this.data, input, stack, 0, this.data, this.precTable);
      if (input.token.value > -1)
        break;
      if (this.elseToken == null)
        return;
      if (!atEof)
        skipped++;
      if (nextPos == null)
        break;
      input.reset(nextPos, input.token);
    }
    if (skipped) {
      input.reset(start, input.token);
      input.acceptToken(this.elseToken, skipped);
    }
  }
}
LocalTokenGroup.prototype.contextual = TokenGroup.prototype.fallback = TokenGroup.prototype.extend = false;

class ExternalTokenizer {
  constructor(token, options = {}) {
    this.token = token;
    this.contextual = !!options.contextual;
    this.fallback = !!options.fallback;
    this.extend = !!options.extend;
  }
}
var verbose = typeof process != "undefined" && process.env && /\bparse\b/.test(process.env.LOG);
var stackIDs = null;

class FragmentCursor {
  constructor(fragments, nodeSet) {
    this.fragments = fragments;
    this.nodeSet = nodeSet;
    this.i = 0;
    this.fragment = null;
    this.safeFrom = -1;
    this.safeTo = -1;
    this.trees = [];
    this.start = [];
    this.index = [];
    this.nextFragment();
  }
  nextFragment() {
    let fr = this.fragment = this.i == this.fragments.length ? null : this.fragments[this.i++];
    if (fr) {
      this.safeFrom = fr.openStart ? cutAt(fr.tree, fr.from + fr.offset, 1) - fr.offset : fr.from;
      this.safeTo = fr.openEnd ? cutAt(fr.tree, fr.to + fr.offset, -1) - fr.offset : fr.to;
      while (this.trees.length) {
        this.trees.pop();
        this.start.pop();
        this.index.pop();
      }
      this.trees.push(fr.tree);
      this.start.push(-fr.offset);
      this.index.push(0);
      this.nextStart = this.safeFrom;
    } else {
      this.nextStart = 1e9;
    }
  }
  nodeAt(pos) {
    if (pos < this.nextStart)
      return null;
    while (this.fragment && this.safeTo <= pos)
      this.nextFragment();
    if (!this.fragment)
      return null;
    for (;; ) {
      let last = this.trees.length - 1;
      if (last < 0) {
        this.nextFragment();
        return null;
      }
      let top2 = this.trees[last], index = this.index[last];
      if (index == top2.children.length) {
        this.trees.pop();
        this.start.pop();
        this.index.pop();
        continue;
      }
      let next = top2.children[index];
      let start = this.start[last] + top2.positions[index];
      if (start > pos) {
        this.nextStart = start;
        return null;
      }
      if (next instanceof Tree) {
        if (start == pos) {
          if (start < this.safeFrom)
            return null;
          let end = start + next.length;
          if (end <= this.safeTo) {
            let lookAhead = next.prop(NodeProp.lookAhead);
            if (!lookAhead || end + lookAhead < this.fragment.to)
              return next;
          }
        }
        this.index[last]++;
        if (start + next.length >= Math.max(this.safeFrom, pos)) {
          this.trees.push(next);
          this.start.push(start);
          this.index.push(0);
        }
      } else {
        this.index[last]++;
        this.nextStart = start + next.length;
      }
    }
  }
}

class TokenCache {
  constructor(parser, stream) {
    this.stream = stream;
    this.tokens = [];
    this.mainToken = null;
    this.actions = [];
    this.tokens = parser.tokenizers.map((_) => new CachedToken);
  }
  getActions(stack) {
    let actionIndex = 0;
    let main = null;
    let { parser } = stack.p, { tokenizers } = parser;
    let mask = parser.stateSlot(stack.state, 3);
    let context = stack.curContext ? stack.curContext.hash : 0;
    let lookAhead = 0;
    for (let i = 0;i < tokenizers.length; i++) {
      if ((1 << i & mask) == 0)
        continue;
      let tokenizer = tokenizers[i], token = this.tokens[i];
      if (main && !tokenizer.fallback)
        continue;
      if (tokenizer.contextual || token.start != stack.pos || token.mask != mask || token.context != context) {
        this.updateCachedToken(token, tokenizer, stack);
        token.mask = mask;
        token.context = context;
      }
      if (token.lookAhead > token.end + 25)
        lookAhead = Math.max(token.lookAhead, lookAhead);
      if (token.value != 0) {
        let startIndex = actionIndex;
        if (token.extended > -1)
          actionIndex = this.addActions(stack, token.extended, token.end, actionIndex);
        actionIndex = this.addActions(stack, token.value, token.end, actionIndex);
        if (!tokenizer.extend) {
          main = token;
          if (actionIndex > startIndex)
            break;
        }
      }
    }
    while (this.actions.length > actionIndex)
      this.actions.pop();
    if (lookAhead)
      stack.setLookAhead(lookAhead);
    if (!main && stack.pos == this.stream.end) {
      main = new CachedToken;
      main.value = stack.p.parser.eofTerm;
      main.start = main.end = stack.pos;
      actionIndex = this.addActions(stack, main.value, main.end, actionIndex);
    }
    this.mainToken = main;
    return this.actions;
  }
  getMainToken(stack) {
    if (this.mainToken)
      return this.mainToken;
    let main = new CachedToken, { pos, p } = stack;
    main.start = pos;
    main.end = Math.min(pos + 1, p.stream.end);
    main.value = pos == p.stream.end ? p.parser.eofTerm : 0;
    return main;
  }
  updateCachedToken(token, tokenizer, stack) {
    let start = this.stream.clipPos(stack.pos);
    tokenizer.token(this.stream.reset(start, token), stack);
    if (token.value > -1) {
      let { parser } = stack.p;
      for (let i = 0;i < parser.specialized.length; i++)
        if (parser.specialized[i] == token.value) {
          let result = parser.specializers[i](this.stream.read(token.start, token.end), stack);
          if (result >= 0 && stack.p.parser.dialect.allows(result >> 1)) {
            if ((result & 1) == 0)
              token.value = result >> 1;
            else
              token.extended = result >> 1;
            break;
          }
        }
    } else {
      token.value = 0;
      token.end = this.stream.clipPos(start + 1);
    }
  }
  putAction(action, token, end, index) {
    for (let i = 0;i < index; i += 3)
      if (this.actions[i] == action)
        return index;
    this.actions[index++] = action;
    this.actions[index++] = token;
    this.actions[index++] = end;
    return index;
  }
  addActions(stack, token, end, index) {
    let { state: state8 } = stack, { parser } = stack.p, { data } = parser;
    for (let set = 0;set < 2; set++) {
      for (let i = parser.stateSlot(state8, set ? 2 : 1);; i += 3) {
        if (data[i] == 65535) {
          if (data[i + 1] == 1) {
            i = pair(data, i + 2);
          } else {
            if (index == 0 && data[i + 1] == 2)
              index = this.putAction(pair(data, i + 2), token, end, index);
            break;
          }
        }
        if (data[i] == token)
          index = this.putAction(pair(data, i + 1), token, end, index);
      }
    }
    return index;
  }
}

class Parse {
  constructor(parser, input, fragments, ranges) {
    this.parser = parser;
    this.input = input;
    this.ranges = ranges;
    this.recovering = 0;
    this.nextStackID = 9812;
    this.minStackPos = 0;
    this.reused = [];
    this.stoppedAt = null;
    this.lastBigReductionStart = -1;
    this.lastBigReductionSize = 0;
    this.bigReductionCount = 0;
    this.stream = new InputStream(input, ranges);
    this.tokens = new TokenCache(parser, this.stream);
    this.topTerm = parser.top[1];
    let { from } = ranges[0];
    this.stacks = [Stack.start(this, parser.top[0], from)];
    this.fragments = fragments.length && this.stream.end - from > parser.bufferLength * 4 ? new FragmentCursor(fragments, parser.nodeSet) : null;
  }
  get parsedPos() {
    return this.minStackPos;
  }
  advance() {
    let stacks = this.stacks, pos = this.minStackPos;
    let newStacks = this.stacks = [];
    let stopped, stoppedTokens;
    if (this.bigReductionCount > 300 && stacks.length == 1) {
      let [s] = stacks;
      while (s.forceReduce() && s.stack.length && s.stack[s.stack.length - 2] >= this.lastBigReductionStart) {
      }
      this.bigReductionCount = this.lastBigReductionSize = 0;
    }
    for (let i = 0;i < stacks.length; i++) {
      let stack = stacks[i];
      for (;; ) {
        this.tokens.mainToken = null;
        if (stack.pos > pos) {
          newStacks.push(stack);
        } else if (this.advanceStack(stack, newStacks, stacks)) {
          continue;
        } else {
          if (!stopped) {
            stopped = [];
            stoppedTokens = [];
          }
          stopped.push(stack);
          let tok = this.tokens.getMainToken(stack);
          stoppedTokens.push(tok.value, tok.end);
        }
        break;
      }
    }
    if (!newStacks.length) {
      let finished = stopped && findFinished(stopped);
      if (finished) {
        if (verbose)
          console.log("Finish with " + this.stackID(finished));
        return this.stackToTree(finished);
      }
      if (this.parser.strict) {
        if (verbose && stopped)
          console.log("Stuck with token " + (this.tokens.mainToken ? this.parser.getName(this.tokens.mainToken.value) : "none"));
        throw new SyntaxError("No parse at " + pos);
      }
      if (!this.recovering)
        this.recovering = 5;
    }
    if (this.recovering && stopped) {
      let finished = this.stoppedAt != null && stopped[0].pos > this.stoppedAt ? stopped[0] : this.runRecovery(stopped, stoppedTokens, newStacks);
      if (finished) {
        if (verbose)
          console.log("Force-finish " + this.stackID(finished));
        return this.stackToTree(finished.forceAll());
      }
    }
    if (this.recovering) {
      let maxRemaining = this.recovering == 1 ? 1 : this.recovering * 3;
      if (newStacks.length > maxRemaining) {
        newStacks.sort((a, b) => b.score - a.score);
        while (newStacks.length > maxRemaining)
          newStacks.pop();
      }
      if (newStacks.some((s) => s.reducePos > pos))
        this.recovering--;
    } else if (newStacks.length > 1) {
      outer:
        for (let i = 0;i < newStacks.length - 1; i++) {
          let stack = newStacks[i];
          for (let j = i + 1;j < newStacks.length; j++) {
            let other = newStacks[j];
            if (stack.sameState(other) || stack.buffer.length > 500 && other.buffer.length > 500) {
              if ((stack.score - other.score || stack.buffer.length - other.buffer.length) > 0) {
                newStacks.splice(j--, 1);
              } else {
                newStacks.splice(i--, 1);
                continue outer;
              }
            }
          }
        }
      if (newStacks.length > 12)
        newStacks.splice(12, newStacks.length - 12);
    }
    this.minStackPos = newStacks[0].pos;
    for (let i = 1;i < newStacks.length; i++)
      if (newStacks[i].pos < this.minStackPos)
        this.minStackPos = newStacks[i].pos;
    return null;
  }
  stopAt(pos) {
    if (this.stoppedAt != null && this.stoppedAt < pos)
      throw new RangeError("Can't move stoppedAt forward");
    this.stoppedAt = pos;
  }
  advanceStack(stack, stacks, split) {
    let start = stack.pos, { parser } = this;
    let base2 = verbose ? this.stackID(stack) + " -> " : "";
    if (this.stoppedAt != null && start > this.stoppedAt)
      return stack.forceReduce() ? stack : null;
    if (this.fragments) {
      let strictCx = stack.curContext && stack.curContext.tracker.strict, cxHash = strictCx ? stack.curContext.hash : 0;
      for (let cached = this.fragments.nodeAt(start);cached; ) {
        let match = this.parser.nodeSet.types[cached.type.id] == cached.type ? parser.getGoto(stack.state, cached.type.id) : -1;
        if (match > -1 && cached.length && (!strictCx || (cached.prop(NodeProp.contextHash) || 0) == cxHash)) {
          stack.useNode(cached, match);
          if (verbose)
            console.log(base2 + this.stackID(stack) + ` (via reuse of ${parser.getName(cached.type.id)})`);
          return true;
        }
        if (!(cached instanceof Tree) || cached.children.length == 0 || cached.positions[0] > 0)
          break;
        let inner = cached.children[0];
        if (inner instanceof Tree && cached.positions[0] == 0)
          cached = inner;
        else
          break;
      }
    }
    let defaultReduce = parser.stateSlot(stack.state, 4);
    if (defaultReduce > 0) {
      stack.reduce(defaultReduce);
      if (verbose)
        console.log(base2 + this.stackID(stack) + ` (via always-reduce ${parser.getName(defaultReduce & 65535)})`);
      return true;
    }
    if (stack.stack.length >= 15000) {
      while (stack.stack.length > 9000 && stack.forceReduce()) {
      }
    }
    let actions = this.tokens.getActions(stack);
    for (let i = 0;i < actions.length; ) {
      let action = actions[i++], term = actions[i++], end = actions[i++];
      let last = i == actions.length || !split;
      let localStack = last ? stack : stack.split();
      localStack.apply(action, term, end);
      if (verbose)
        console.log(base2 + this.stackID(localStack) + ` (via ${(action & 65536) == 0 ? "shift" : `reduce of ${parser.getName(action & 65535)}`} for ${parser.getName(term)} @ ${start}${localStack == stack ? "" : ", split"})`);
      if (last)
        return true;
      else if (localStack.pos > start)
        stacks.push(localStack);
      else
        split.push(localStack);
    }
    return false;
  }
  advanceFully(stack, newStacks) {
    let pos = stack.pos;
    for (;; ) {
      if (!this.advanceStack(stack, null, null))
        return false;
      if (stack.pos > pos) {
        pushStackDedup(stack, newStacks);
        return true;
      }
    }
  }
  runRecovery(stacks, tokens, newStacks) {
    let finished = null, restarted = false;
    for (let i = 0;i < stacks.length; i++) {
      let stack = stacks[i], token = tokens[i << 1], tokenEnd = tokens[(i << 1) + 1];
      let base2 = verbose ? this.stackID(stack) + " -> " : "";
      if (stack.deadEnd) {
        if (restarted)
          continue;
        restarted = true;
        stack.restart();
        if (verbose)
          console.log(base2 + this.stackID(stack) + " (restarted)");
        let done = this.advanceFully(stack, newStacks);
        if (done)
          continue;
      }
      let force = stack.split(), forceBase = base2;
      for (let j = 0;force.forceReduce() && j < 10; j++) {
        if (verbose)
          console.log(forceBase + this.stackID(force) + " (via force-reduce)");
        let done = this.advanceFully(force, newStacks);
        if (done)
          break;
        if (verbose)
          forceBase = this.stackID(force) + " -> ";
      }
      for (let insert2 of stack.recoverByInsert(token)) {
        if (verbose)
          console.log(base2 + this.stackID(insert2) + " (via recover-insert)");
        this.advanceFully(insert2, newStacks);
      }
      if (this.stream.end > stack.pos) {
        if (tokenEnd == stack.pos) {
          tokenEnd++;
          token = 0;
        }
        stack.recoverByDelete(token, tokenEnd);
        if (verbose)
          console.log(base2 + this.stackID(stack) + ` (via recover-delete ${this.parser.getName(token)})`);
        pushStackDedup(stack, newStacks);
      } else if (!finished || finished.score < stack.score) {
        finished = stack;
      }
    }
    return finished;
  }
  stackToTree(stack) {
    stack.close();
    return Tree.build({
      buffer: StackBufferCursor.create(stack),
      nodeSet: this.parser.nodeSet,
      topID: this.topTerm,
      maxBufferLength: this.parser.bufferLength,
      reused: this.reused,
      start: this.ranges[0].from,
      length: stack.pos - this.ranges[0].from,
      minRepeatType: this.parser.minRepeatTerm
    });
  }
  stackID(stack) {
    let id = (stackIDs || (stackIDs = new WeakMap)).get(stack);
    if (!id)
      stackIDs.set(stack, id = String.fromCodePoint(this.nextStackID++));
    return id + stack;
  }
}

class Dialect {
  constructor(source, flags, disabled) {
    this.source = source;
    this.flags = flags;
    this.disabled = disabled;
  }
  allows(term) {
    return !this.disabled || this.disabled[term] == 0;
  }
}
var id = (x) => x;

class ContextTracker {
  constructor(spec) {
    this.start = spec.start;
    this.shift = spec.shift || id;
    this.reduce = spec.reduce || id;
    this.reuse = spec.reuse || id;
    this.hash = spec.hash || (() => 0);
    this.strict = spec.strict !== false;
  }
}

class LRParser extends Parser {
  constructor(spec) {
    super();
    this.wrappers = [];
    if (spec.version != 14)
      throw new RangeError(`Parser version (${spec.version}) doesn't match runtime version (${14})`);
    let nodeNames = spec.nodeNames.split(" ");
    this.minRepeatTerm = nodeNames.length;
    for (let i = 0;i < spec.repeatNodeCount; i++)
      nodeNames.push("");
    let topTerms = Object.keys(spec.topRules).map((r) => spec.topRules[r][1]);
    let nodeProps = [];
    for (let i = 0;i < nodeNames.length; i++)
      nodeProps.push([]);
    function setProp(nodeID, prop, value) {
      nodeProps[nodeID].push([prop, prop.deserialize(String(value))]);
    }
    if (spec.nodeProps)
      for (let propSpec of spec.nodeProps) {
        let prop = propSpec[0];
        if (typeof prop == "string")
          prop = NodeProp[prop];
        for (let i = 1;i < propSpec.length; ) {
          let next = propSpec[i++];
          if (next >= 0) {
            setProp(next, prop, propSpec[i++]);
          } else {
            let value = propSpec[i + -next];
            for (let j = -next;j > 0; j--)
              setProp(propSpec[i++], prop, value);
            i++;
          }
        }
      }
    this.nodeSet = new NodeSet(nodeNames.map((name2, i) => NodeType.define({
      name: i >= this.minRepeatTerm ? undefined : name2,
      id: i,
      props: nodeProps[i],
      top: topTerms.indexOf(i) > -1,
      error: i == 0,
      skipped: spec.skippedNodes && spec.skippedNodes.indexOf(i) > -1
    })));
    if (spec.propSources)
      this.nodeSet = this.nodeSet.extend(...spec.propSources);
    this.strict = false;
    this.bufferLength = DefaultBufferLength;
    let tokenArray = decodeArray(spec.tokenData);
    this.context = spec.context;
    this.specializerSpecs = spec.specialized || [];
    this.specialized = new Uint16Array(this.specializerSpecs.length);
    for (let i = 0;i < this.specializerSpecs.length; i++)
      this.specialized[i] = this.specializerSpecs[i].term;
    this.specializers = this.specializerSpecs.map(getSpecializer);
    this.states = decodeArray(spec.states, Uint32Array);
    this.data = decodeArray(spec.stateData);
    this.goto = decodeArray(spec.goto);
    this.maxTerm = spec.maxTerm;
    this.tokenizers = spec.tokenizers.map((value) => typeof value == "number" ? new TokenGroup(tokenArray, value) : value);
    this.topRules = spec.topRules;
    this.dialects = spec.dialects || {};
    this.dynamicPrecedences = spec.dynamicPrecedences || null;
    this.tokenPrecTable = spec.tokenPrec;
    this.termNames = spec.termNames || null;
    this.maxNode = this.nodeSet.types.length - 1;
    this.dialect = this.parseDialect();
    this.top = this.topRules[Object.keys(this.topRules)[0]];
  }
  createParse(input, fragments, ranges) {
    let parse = new Parse(this, input, fragments, ranges);
    for (let w of this.wrappers)
      parse = w(parse, input, fragments, ranges);
    return parse;
  }
  getGoto(state8, term, loose = false) {
    let table = this.goto;
    if (term >= table[0])
      return -1;
    for (let pos = table[term + 1];; ) {
      let groupTag = table[pos++], last = groupTag & 1;
      let target = table[pos++];
      if (last && loose)
        return target;
      for (let end = pos + (groupTag >> 1);pos < end; pos++)
        if (table[pos] == state8)
          return target;
      if (last)
        return -1;
    }
  }
  hasAction(state8, terminal) {
    let data = this.data;
    for (let set = 0;set < 2; set++) {
      for (let i = this.stateSlot(state8, set ? 2 : 1), next;; i += 3) {
        if ((next = data[i]) == 65535) {
          if (data[i + 1] == 1)
            next = data[i = pair(data, i + 2)];
          else if (data[i + 1] == 2)
            return pair(data, i + 2);
          else
            break;
        }
        if (next == terminal || next == 0)
          return pair(data, i + 1);
      }
    }
    return 0;
  }
  stateSlot(state8, slot) {
    return this.states[state8 * 6 + slot];
  }
  stateFlag(state8, flag) {
    return (this.stateSlot(state8, 0) & flag) > 0;
  }
  validAction(state8, action) {
    return !!this.allActions(state8, (a) => a == action ? true : null);
  }
  allActions(state8, action) {
    let deflt = this.stateSlot(state8, 4);
    let result = deflt ? action(deflt) : undefined;
    for (let i = this.stateSlot(state8, 1);result == null; i += 3) {
      if (this.data[i] == 65535) {
        if (this.data[i + 1] == 1)
          i = pair(this.data, i + 2);
        else
          break;
      }
      result = action(pair(this.data, i + 1));
    }
    return result;
  }
  nextStates(state8) {
    let result = [];
    for (let i = this.stateSlot(state8, 1);; i += 3) {
      if (this.data[i] == 65535) {
        if (this.data[i + 1] == 1)
          i = pair(this.data, i + 2);
        else
          break;
      }
      if ((this.data[i + 2] & 65536 >> 16) == 0) {
        let value = this.data[i + 1];
        if (!result.some((v, i2) => i2 & 1 && v == value))
          result.push(this.data[i], value);
      }
    }
    return result;
  }
  configure(config2) {
    let copy = Object.assign(Object.create(LRParser.prototype), this);
    if (config2.props)
      copy.nodeSet = this.nodeSet.extend(...config2.props);
    if (config2.top) {
      let info = this.topRules[config2.top];
      if (!info)
        throw new RangeError(`Invalid top rule name ${config2.top}`);
      copy.top = info;
    }
    if (config2.tokenizers)
      copy.tokenizers = this.tokenizers.map((t2) => {
        let found = config2.tokenizers.find((r) => r.from == t2);
        return found ? found.to : t2;
      });
    if (config2.specializers) {
      copy.specializers = this.specializers.slice();
      copy.specializerSpecs = this.specializerSpecs.map((s, i) => {
        let found = config2.specializers.find((r) => r.from == s.external);
        if (!found)
          return s;
        let spec = Object.assign(Object.assign({}, s), { external: found.to });
        copy.specializers[i] = getSpecializer(spec);
        return spec;
      });
    }
    if (config2.contextTracker)
      copy.context = config2.contextTracker;
    if (config2.dialect)
      copy.dialect = this.parseDialect(config2.dialect);
    if (config2.strict != null)
      copy.strict = config2.strict;
    if (config2.wrap)
      copy.wrappers = copy.wrappers.concat(config2.wrap);
    if (config2.bufferLength != null)
      copy.bufferLength = config2.bufferLength;
    return copy;
  }
  hasWrappers() {
    return this.wrappers.length > 0;
  }
  getName(term) {
    return this.termNames ? this.termNames[term] : String(term <= this.maxNode && this.nodeSet.types[term].name || term);
  }
  get eofTerm() {
    return this.maxNode + 1;
  }
  get topNode() {
    return this.nodeSet.types[this.top[1]];
  }
  dynamicPrecedence(term) {
    let prec2 = this.dynamicPrecedences;
    return prec2 == null ? 0 : prec2[term] || 0;
  }
  parseDialect(dialect) {
    let values = Object.keys(this.dialects), flags = values.map(() => false);
    if (dialect)
      for (let part of dialect.split(" ")) {
        let id2 = values.indexOf(part);
        if (id2 >= 0)
          flags[id2] = true;
      }
    let disabled = null;
    for (let i = 0;i < values.length; i++)
      if (!flags[i]) {
        for (let j = this.dialects[values[i]], id2;(id2 = this.data[j++]) != 65535; )
          (disabled || (disabled = new Uint8Array(this.maxTerm + 1)))[id2] = 1;
      }
    return new Dialect(dialect, flags, disabled);
  }
  static deserialize(spec) {
    return new LRParser(spec);
  }
}

// /home/ray/Code/diagramatics-site/node_modules/@lezer/javascript/dist/index.js
var noSemi = 304;
var incdec = 1;
var incdecPrefix = 2;
var insertSemi = 305;
var spaces = 307;
var newline = 308;
var LineComment = 3;
var BlockComment = 4;
var space = [
  9,
  10,
  11,
  12,
  13,
  32,
  133,
  160,
  5760,
  8192,
  8193,
  8194,
  8195,
  8196,
  8197,
  8198,
  8199,
  8200,
  8201,
  8202,
  8232,
  8233,
  8239,
  8287,
  12288
];
var braceR = 125;
var semicolon = 59;
var slash = 47;
var star = 42;
var plus = 43;
var minus = 45;
var trackNewline = new ContextTracker({
  start: false,
  shift(context, term) {
    return term == LineComment || term == BlockComment || term == spaces ? context : term == newline;
  },
  strict: false
});
var insertSemicolon = new ExternalTokenizer((input, stack) => {
  let { next } = input;
  if (next == braceR || next == -1 || stack.context)
    input.acceptToken(insertSemi);
}, { contextual: true, fallback: true });
var noSemicolon = new ExternalTokenizer((input, stack) => {
  let { next } = input, after;
  if (space.indexOf(next) > -1)
    return;
  if (next == slash && ((after = input.peek(1)) == slash || after == star))
    return;
  if (next != braceR && next != semicolon && next != -1 && !stack.context)
    input.acceptToken(noSemi);
}, { contextual: true });
var incdecToken = new ExternalTokenizer((input, stack) => {
  let { next } = input;
  if (next == plus || next == minus) {
    input.advance();
    if (next == input.next) {
      input.advance();
      let mayPostfix = !stack.context && stack.canShift(incdec);
      input.acceptToken(mayPostfix ? incdec : incdecPrefix);
    }
  }
}, { contextual: true });
var jsHighlight = styleTags({
  "get set async static": tags.modifier,
  "for while do if else switch try catch finally return throw break continue default case": tags.controlKeyword,
  "in of await yield void typeof delete instanceof": tags.operatorKeyword,
  "let var const function class extends": tags.definitionKeyword,
  "import export from": tags.moduleKeyword,
  "with debugger as new": tags.keyword,
  TemplateString: tags.special(tags.string),
  super: tags.atom,
  BooleanLiteral: tags.bool,
  this: tags.self,
  null: tags.null,
  Star: tags.modifier,
  VariableName: tags.variableName,
  "CallExpression/VariableName TaggedTemplateExpression/VariableName": tags.function(tags.variableName),
  VariableDefinition: tags.definition(tags.variableName),
  Label: tags.labelName,
  PropertyName: tags.propertyName,
  PrivatePropertyName: tags.special(tags.propertyName),
  "CallExpression/MemberExpression/PropertyName": tags.function(tags.propertyName),
  "FunctionDeclaration/VariableDefinition": tags.function(tags.definition(tags.variableName)),
  "ClassDeclaration/VariableDefinition": tags.definition(tags.className),
  PropertyDefinition: tags.definition(tags.propertyName),
  PrivatePropertyDefinition: tags.definition(tags.special(tags.propertyName)),
  UpdateOp: tags.updateOperator,
  "LineComment Hashbang": tags.lineComment,
  BlockComment: tags.blockComment,
  Number: tags.number,
  String: tags.string,
  Escape: tags.escape,
  ArithOp: tags.arithmeticOperator,
  LogicOp: tags.logicOperator,
  BitOp: tags.bitwiseOperator,
  CompareOp: tags.compareOperator,
  RegExp: tags.regexp,
  Equals: tags.definitionOperator,
  Arrow: tags.function(tags.punctuation),
  ": Spread": tags.punctuation,
  "( )": tags.paren,
  "[ ]": tags.squareBracket,
  "{ }": tags.brace,
  "InterpolationStart InterpolationEnd": tags.special(tags.brace),
  ".": tags.derefOperator,
  ", ;": tags.separator,
  "@": tags.meta,
  TypeName: tags.typeName,
  TypeDefinition: tags.definition(tags.typeName),
  "type enum interface implements namespace module declare": tags.definitionKeyword,
  "abstract global Privacy readonly override": tags.modifier,
  "is keyof unique infer": tags.operatorKeyword,
  JSXAttributeValue: tags.attributeValue,
  JSXText: tags.content,
  "JSXStartTag JSXStartCloseTag JSXSelfCloseEndTag JSXEndTag": tags.angleBracket,
  "JSXIdentifier JSXNameSpacedName": tags.tagName,
  "JSXAttribute/JSXIdentifier JSXAttribute/JSXNameSpacedName": tags.attributeName,
  "JSXBuiltin/JSXIdentifier": tags.standard(tags.tagName)
});
var spec_identifier = { __proto__: null, export: 16, as: 21, from: 29, default: 32, async: 37, function: 38, extends: 48, this: 52, true: 60, false: 60, null: 72, void: 76, typeof: 80, super: 98, new: 132, delete: 148, yield: 157, await: 161, class: 166, public: 223, private: 223, protected: 223, readonly: 225, instanceof: 244, satisfies: 247, in: 248, const: 250, import: 282, keyof: 337, unique: 341, infer: 347, is: 383, abstract: 403, implements: 405, type: 407, let: 410, var: 412, using: 415, interface: 421, enum: 425, namespace: 431, module: 433, declare: 437, global: 441, for: 460, of: 469, while: 472, with: 476, do: 480, if: 484, else: 486, switch: 490, case: 496, try: 502, catch: 506, finally: 510, return: 514, throw: 518, break: 522, continue: 526, debugger: 530 };
var spec_word = { __proto__: null, async: 119, get: 121, set: 123, declare: 183, public: 185, private: 185, protected: 185, static: 187, abstract: 189, override: 191, readonly: 197, accessor: 199, new: 387 };
var spec_LessThan = { __proto__: null, "<": 139 };
var parser = LRParser.deserialize({
  version: 14,
  states: "$6zO%TQUOOO%[QUOOO'_QWOOP(lOSOOO*zQ(CjO'#CgO+ROpO'#ChO+aO!bO'#ChO+oO07`O'#D[O.QQUO'#DbO.bQUO'#DmO%[QUO'#DwO0fQUO'#EPOOQ(CY'#EX'#EXO1PQSO'#EUOOQO'#Ej'#EjOOQO'#Id'#IdO1XQSO'#GlO1dQSO'#EiO1iQSO'#EiO3kQ(CjO'#JeO6[Q(CjO'#JfO6xQSO'#FXO6}Q#tO'#FpOOQ(CY'#Fa'#FaO7YO&jO'#FaO7hQ,UO'#FwO9OQSO'#FvOOQ(CY'#Jf'#JfOOQ(CW'#Je'#JeO9TQSO'#GpOOQQ'#KQ'#KQO9`QSO'#IQO9eQ(C[O'#IROOQQ'#JR'#JROOQQ'#IV'#IVQ`QUOOO`QUOOO%[QUO'#DoO9mQUO'#D{O9tQUO'#D}O9ZQSO'#GlO9{Q,UO'#CmO:ZQSO'#EhO:fQSO'#EsO:kQ,UO'#F`O;YQSO'#GlOOQO'#KR'#KRO;_QSO'#KRO;mQSO'#GtO;mQSO'#GuO;mQSO'#GwO9ZQSO'#GzO<dQSO'#G}O={QSO'#CcO>]QSO'#HZO>eQSO'#HaO>eQSO'#HcO`QUO'#HeO>eQSO'#HgO>eQSO'#HjO>jQSO'#HpO>oQ(C]O'#HvO%[QUO'#HxO>zQ(C]O'#HzO?VQ(C]O'#H|O9eQ(C[O'#IOO?bQ(CjO'#CgO@dQWO'#DgQOQSOOO%[QUO'#D}O@zQSO'#EQO9{Q,UO'#EhOAVQSO'#EhOAbQ`O'#F`OOQQ'#Ce'#CeOOQ(CW'#Dl'#DlOOQ(CW'#Ji'#JiO%[QUO'#JiOOQO'#Jm'#JmOOQO'#Ia'#IaOBbQWO'#EaOOQ(CW'#E`'#E`OC^Q(C`O'#EaOChQWO'#ETOOQO'#Jl'#JlOC|QWO'#JmOEZQWO'#ETOChQWO'#EaPEhO?MpO'#C`POOO)CDp)CDpOOOO'#IW'#IWOEsOpO,59SOOQ(CY,59S,59SOOOO'#IX'#IXOFRO!bO,59SO%[QUO'#D^OOOO'#IZ'#IZOFaO07`O,59vOOQ(CY,59v,59vOFoQUO'#I[OGSQSO'#JgOIUQbO'#JgO+}QUO'#JgOI]QSO,59|OIsQSO'#EjOJQQSO'#JuOJ]QSO'#JtOJ]QSO'#JtOJeQSO,5;WOJjQSO'#JsOOQ(CY,5:X,5:XOJqQUO,5:XOLrQ(CjO,5:cOMcQSO,5:kOM|Q(C[O'#JrONTQSO'#JqO9TQSO'#JqONiQSO'#JqONqQSO,5;VONvQSO'#JqO!#OQbO'#JfOOQ(CY'#Cg'#CgO%[QUO'#EPO!#nQ`O,5:pOOQO'#Jn'#JnOOQO-E<b-E<bO9ZQSO,5=WO!$UQSO,5=WO!$ZQUO,5;TO!&^Q,UO'#EeO!'qQSO,5;TO!)ZQ,UO'#DqO!)bQUO'#DvO!)lQWO,5;^O!)tQWO,5;^O%[QUO,5;^OOQQ'#FP'#FPOOQQ'#FR'#FRO%[QUO,5;_O%[QUO,5;_O%[QUO,5;_O%[QUO,5;_O%[QUO,5;_O%[QUO,5;_O%[QUO,5;_O%[QUO,5;_O%[QUO,5;_O%[QUO,5;_O%[QUO,5;_OOQQ'#FV'#FVO!*SQUO,5;pOOQ(CY,5;u,5;uOOQ(CY,5;v,5;vO!,VQSO,5;vOOQ(CY,5;w,5;wO%[QUO'#IhO!,_Q(C[O,5<dO!&^Q,UO,5;_O!,|Q,UO,5;_O%[QUO,5;sO!-TQ#tO'#FfO!.QQ#tO'#JyO!-lQ#tO'#JyO!.XQ#tO'#JyOOQO'#Jy'#JyO!.mQ#tO,5<OOOOO,5<[,5<[O!/OQUO'#FrOOOO'#Ig'#IgO7YO&jO,5;{O!/VQ#tO'#FtOOQ(CY,5;{,5;{O!/vQ7[O'#CsOOQ(CY'#Cw'#CwO!0ZQSO'#CwO!0`O07`O'#C{O!0|Q,UO,5<aO!1TQSO,5<cO!2jQMhO'#GRO!2wQSO'#GSO!2|QSO'#GSO!3RQMhO'#GWO!4QQWO'#G[O!4sQ7[O'#J`OOQ(CY'#J`'#J`O!4}QSO'#J_O!5]QSO'#J^O!5eQSO'#CrOOQ(CY'#Cu'#CuOOQ(CY'#DP'#DPOOQ(CY'#DR'#DRO1SQSO'#DTO!'vQ,UO'#FyO!'vQ,UO'#F{O!5mQSO'#F}O!5rQSO'#GOO!2|QSO'#GUO!'vQ,UO'#GZO!5wQSO'#EkO!6fQSO,5<bOOQ(CW'#Cp'#CpO!6nQSO'#ElO!7hQWO'#EmOOQ(CW'#Js'#JsO!7oQ(C[O'#KSO9eQ(C[O,5=[O`QUO,5>lOOQQ'#JZ'#JZOOQQ,5>m,5>mOOQQ-E<T-E<TO!9qQ(CjO,5:ZO!<_Q(CjO,5:gO%[QUO,5:gO!>xQ(CjO,5:iOOQO,5@m,5@mO!?iQ,UO,5=WO!?wQ(C[O'#J[O9OQSO'#J[O!@YQ(C[O,59XO!@eQWO,59XO!@mQ,UO,59XO9{Q,UO,59XO!@xQSO,5;TO!AQQSO'#HYO!AcQSO'#KVO%[QUO,5;xO!7cQWO,5;zO!AkQSO,5=sO!ApQSO,5=sO!AuQSO,5=sO9eQ(C[O,5=sO;mQSO,5=cOOQO'#Cs'#CsO!BTQWO,5=`O!B]Q,UO,5=aO!BhQSO,5=cO!BmQ`O,5=fO!BuQSO'#KRO>jQSO'#HPO9ZQSO'#HRO!BzQSO'#HRO9{Q,UO'#HTO!CPQSO'#HTOOQQ,5=i,5=iO!CUQSO'#HUO!C^QSO'#CmO!CcQSO,58}O!CmQSO,58}O!ErQUO,58}OOQQ,58},58}O!FSQ(C[O,58}O%[QUO,58}O!H_QUO'#H]OOQQ'#H^'#H^OOQQ'#H_'#H_O`QUO,5=uO!HuQSO,5=uO`QUO,5={O`QUO,5=}O!HzQSO,5>PO`QUO,5>RO!IPQSO,5>UO!IUQUO,5>[OOQQ,5>b,5>bO%[QUO,5>bO9eQ(C[O,5>dOOQQ,5>f,5>fO!M`QSO,5>fOOQQ,5>h,5>hO!M`QSO,5>hOOQQ,5>j,5>jO!MeQWO'#DYO%[QUO'#JiO!NSQWO'#JiO!NqQWO'#DhO# SQWO'#DhO##eQUO'#DhO##lQSO'#JhO##tQSO,5:RO##yQSO'#EnO#$XQSO'#JvO#$aQSO,5;XO#$fQWO'#DhO#$sQWO'#ESOOQ(CY,5:l,5:lO%[QUO,5:lO#$zQSO,5:lO>jQSO,5;SO!@eQWO,5;SO!@mQ,UO,5;SO9{Q,UO,5;SO#%SQSO,5@TO#%XQ!LQO,5:pOOQO-E<_-E<_O#&_Q(C`O,5:{OChQWO,5:oO#&iQWO,5:oOChQWO,5:{O!@YQ(C[O,5:oOOQ(CW'#Ed'#EdOOQO,5:{,5:{O%[QUO,5:{O#&vQ(C[O,5:{O#'RQ(C[O,5:{O!@eQWO,5:oOOQO,5;R,5;RO#'aQ(C[O,5:{POOO'#IU'#IUP#'uO?MpO,58zPOOO,58z,58zOOOO-E<U-E<UOOQ(CY1G.n1G.nOOOO-E<V-E<VO#(QQ`O,59xOOOO-E<X-E<XOOQ(CY1G/b1G/bO#(VQbO,5>vO+}QUO,5>vOOQO,5>|,5>|O#(aQUO'#I[OOQO-E<Y-E<YO#(nQSO,5@RO#(vQbO,5@RO#(}QSO,5@`OOQ(CY1G/h1G/hO%[QUO,5@aO#)VQSO'#IbOOQO-E<`-E<`O#(}QSO,5@`OOQ(CW1G0r1G0rOOQ(CY1G/s1G/sOOQ(CY1G0V1G0VO%[QUO,5@^O#)kQ(C[O,5@^O#)|Q(C[O,5@^O#*TQSO,5@]O9TQSO,5@]O#*]QSO,5@]O#*kQSO'#IeO#*TQSO,5@]OOQ(CW1G0q1G0qO!)lQWO,5:rO!)wQWO,5:rOOQO,5:t,5:tO#+]QSO,5:tO#+eQ,UO1G2rO9ZQSO1G2rOOQ(CY1G0o1G0oO#+sQ(CjO1G0oO#,xQ(ChO,5;POOQ(CY'#GQ'#GQO#-fQ(CjO'#J`O!$ZQUO1G0oO#/nQ,UO'#JjO#/xQSO,5:]O#/}QbO'#JkO%[QUO'#JkO#0XQSO,5:bOOQ(CY'#DY'#DYOOQ(CY1G0x1G0xO%[QUO1G0xOOQ(CY1G1b1G1bO#0^QSO1G0xO#2uQ(CjO1G0yO#2|Q(CjO1G0yO#5gQ(CjO1G0yO#5nQ(CjO1G0yO#7xQ(CjO1G0yO#8`Q(CjO1G0yO#;YQ(CjO1G0yO#;aQ(CjO1G0yO#=zQ(CjO1G0yO#>RQ(CjO1G0yO#?yQ(CjO1G0yO#ByQ$IUO'#CgO#DwQ$IUO1G1[O#EOQ$IUO'#JfO!,YQSO1G1bO#E`Q(CjO,5?SOOQ(CW-E<f-E<fO#FSQ(CjO1G0yOOQ(CY1G0y1G0yO#H_Q(CjO1G1_O#IRQ#tO,5<SO#IZQ#tO,5<TO#IcQ#tO'#FkO#IzQSO'#FjOOQO'#Jz'#JzOOQO'#If'#IfO#JPQ#tO1G1jOOQ(CY1G1j1G1jOOOO1G1u1G1uO#JbQ$IUO'#JeO#JlQSO,5<^O!*SQUO,5<^OOOO-E<e-E<eOOQ(CY1G1g1G1gO#JqQWO'#JyOOQ(CY,5<`,5<`O#JyQWO,5<`OOQ(CY,59c,59cO!&^Q,UO'#C}OOOO'#IY'#IYO#KOO07`O,59gOOQ(CY,59g,59gO%[QUO1G1{O!5rQSO'#IjO#KZQ,UO,5<tOOQ(CY,5<q,5<qOOQO'#Gg'#GgO!'vQ,UO,5=QOOQO'#Gi'#GiO!'vQ,UO,5=SO!&^Q,UO,5=UOOQO1G1}1G1}O#KbQ`O'#CpO#KuQ`O,5<mO#K|QSO'#J}O9ZQSO'#J}O#L[QSO,5<oO!'vQ,UO,5<nO#LaQSO'#GTO#LlQSO,5<nO#LqQ`O'#GQO#MOQ`O'#KOO#MYQSO'#KOO!&^Q,UO'#KOO#M_QSO,5<rO#MdQWO'#G]O!3{QWO'#G]O#MuQSO'#G_O#MzQSO'#GaO!2|QSO'#GdO#NPQ(C[O'#IlO#N[QWO,5<vOOQ(CY,5<v,5<vO#NcQWO'#G]O#NqQWO'#G^O#NyQWO'#G^OOQ(CY,5=V,5=VO!'vQ,UO,5?yO!'vQ,UO,5?yO$ OQSO'#ImO$ ZQSO,5?xO$ cQSO,59^O$!SQ,UO,59oOOQ(CY,59o,59oO$!uQ,UO,5<eO$#hQ,UO,5<gO@[QSO,5<iOOQ(CY,5<j,5<jO$#rQSO,5<pO$#wQ,UO,5<uO$$XQSO'#JqO!$ZQUO1G1|O$$^QSO1G1|O9TQSO'#JtO9TQSO'#EnO%[QUO'#EnO9TQSO'#IoO$$cQ(C[O,5@nOOQQ1G2v1G2vOOQQ1G4W1G4WOOQ(CY1G/u1G/uO!,VQSO1G/uO$&hQ(CjO1G0ROOQQ1G2r1G2rO!&^Q,UO1G2rO%[QUO1G2rO$'XQSO1G2rO$'dQ,UO'#EeOOQ(CW,5?v,5?vO$'nQ(C[O,5?vOOQQ1G.s1G.sO!@YQ(C[O1G.sO!@eQWO1G.sO!@mQ,UO1G.sO$(PQSO1G0oO$(UQSO'#CgO$(aQSO'#KWO$(iQSO,5=tO$(nQSO'#KWO$(sQSO'#KWO$)OQSO'#IuO$)^QSO,5@qO$)fQbO1G1dOOQ(CY1G1f1G1fO9ZQSO1G3_O@[QSO1G3_O$)mQSO1G3_O$)rQSO1G3_OOQQ1G3_1G3_O!BhQSO1G2}O!&^Q,UO1G2zO$)wQSO1G2zOOQQ1G2{1G2{O!&^Q,UO1G2{O$)|QSO1G2{O$*UQWO'#GyOOQQ1G2}1G2}O!3{QWO'#IqO!BmQ`O1G3QOOQQ1G3Q1G3QOOQQ,5=k,5=kO$*^Q,UO,5=mO9ZQSO,5=mO#MzQSO,5=oO9OQSO,5=oO!@eQWO,5=oO!@mQ,UO,5=oO9{Q,UO,5=oO$*lQSO'#KUO$*wQSO,5=pOOQQ1G.i1G.iO$*|Q(C[O1G.iO@[QSO1G.iO$+XQSO1G.iO9eQ(C[O1G.iO$-^QbO,5@sO$-nQSO,5@sO9TQSO,5@sO$-yQUO,5=wO$.QQSO,5=wOOQQ1G3a1G3aO`QUO1G3aOOQQ1G3g1G3gOOQQ1G3i1G3iO>eQSO1G3kO$.VQUO1G3mO$2ZQUO'#HlOOQQ1G3p1G3pO$2hQSO'#HrO>jQSO'#HtOOQQ1G3v1G3vO$2pQUO1G3vO9eQ(C[O1G3|OOQQ1G4O1G4OOOQ(CW'#GX'#GXO9eQ(C[O1G4QO9eQ(C[O1G4SO$6wQSO,5@TO!*SQUO,5;YO9TQSO,5;YO>jQSO,5:SO!*SQUO,5:SO!@eQWO,5:SO$6|Q$IUO,5:SOOQO,5;Y,5;YO$7WQWO'#I]O$7nQSO,5@SOOQ(CY1G/m1G/mO$7vQWO'#IcO$8QQSO,5@bOOQ(CW1G0s1G0sO# SQWO,5:SOOQO'#I`'#I`O$8YQWO,5:nOOQ(CY,5:n,5:nO#$}QSO1G0WOOQ(CY1G0W1G0WO%[QUO1G0WOOQ(CY1G0n1G0nO>jQSO1G0nO!@eQWO1G0nO!@mQ,UO1G0nOOQ(CW1G5o1G5oO!@YQ(C[O1G0ZOOQO1G0g1G0gO%[QUO1G0gO$8aQ(C[O1G0gO$8lQ(C[O1G0gO!@eQWO1G0ZOChQWO1G0ZO$8zQ(C[O1G0gOOQO1G0Z1G0ZO$9`Q(CjO1G0gPOOO-E<S-E<SPOOO1G.f1G.fOOOO1G/d1G/dO$9jQ`O,5<dO$9rQbO1G4bOOQO1G4h1G4hO%[QUO,5>vO$9|QSO1G5mO$:UQSO1G5zO$:^QbO1G5{O9TQSO,5>|O$:hQ(CjO1G5xO%[QUO1G5xO$:xQ(C[O1G5xO$;ZQSO1G5wO$;ZQSO1G5wO9TQSO1G5wO$;cQSO,5?PO9TQSO,5?POOQO,5?P,5?PO$;wQSO,5?PO$$XQSO,5?POOQO-E<c-E<cOOQO1G0^1G0^OOQO1G0`1G0`O!,YQSO1G0`OOQQ7+(^7+(^O!&^Q,UO7+(^O%[QUO7+(^O$<VQSO7+(^O$<bQ,UO7+(^O$<pQ(CjO,59oO$>xQ(CjO,5<eO$ATQ(CjO,5<gO$C`Q(CjO,5<uOOQ(CY7+&Z7+&ZO$EqQ(CjO7+&ZO$FeQ,UO'#I^O$FoQSO,5@UOOQ(CY1G/w1G/wO$FwQUO'#I_O$GUQSO,5@VO$G^QbO,5@VOOQ(CY1G/|1G/|O$GhQSO7+&dOOQ(CY7+&d7+&dO$GmQ$IUO,5:cO%[QUO7+&vO$GwQ$IUO,5:ZO$HUQ$IUO,5:gO$H`Q$IUO,5:iOOQ(CY7+&|7+&|OOQO1G1n1G1nOOQO1G1o1G1oO$HjQ#tO,5<VO!*SQUO,5<UOOQO-E<d-E<dOOQ(CY7+'U7+'UOOOO7+'a7+'aOOOO1G1x1G1xO$HuQSO1G1xOOQ(CY1G1z1G1zO$HzQ`O,59iOOOO-E<W-E<WOOQ(CY1G/R1G/RO$IRQ(CjO7+'gOOQ(CY,5?U,5?UO$IuQ`O,5?UOOQ(CY1G2`1G2`P!&^Q,UO'#IjPOQ(CY-E<h-E<hO$JeQ,UO1G2lO$KWQ,UO1G2nO$KbQ`O1G2pOOQ(CY1G2X1G2XO$KiQSO'#IiO$KwQSO,5@iO$KwQSO,5@iO$LPQSO,5@iO$L[QSO,5@iOOQO1G2Z1G2ZO$LjQ,UO1G2YO!'vQ,UO1G2YO$LzQMhO'#IkO$M[QSO,5@jO!&^Q,UO,5@jO$MdQ`O,5@jOOQ(CY1G2^1G2^OOQ(CW,5<w,5<wOOQ(CW,5<x,5<xO$$XQSO,5<xOCXQSO,5<xO!@eQWO,5<wOOQO'#G`'#G`O$MnQSO,5<yOOQ(CW,5<{,5<{O$$XQSO,5=OOOQO,5?W,5?WOOQO-E<j-E<jOOQ(CY1G2b1G2bO!3{QWO,5<wO$MvQSO,5<xO#MuQSO,5<yO!3{QWO,5<xO$NRQ,UO1G5eO$N]Q,UO1G5eOOQO,5?X,5?XOOQO-E<k-E<kOOQO1G.x1G.xO!7cQWO,59qO%[QUO,59qO$NjQSO1G2TO!'vQ,UO1G2[O$NoQ(CjO7+'hOOQ(CY7+'h7+'hO!$ZQUO7+'hO% cQSO,5;YOOQ(CW,5?Z,5?ZOOQ(CW-E<m-E<mOOQ(CY7+%a7+%aO% hQ`O'#KPO#$}QSO7+(^O% rQbO7+(^O$<YQSO7+(^O% yQ(ChO'#CgO%!^Q(ChO,5<|O%#OQSO,5<|OOQ(CW1G5b1G5bOOQQ7+$_7+$_O!@YQ(C[O7+$_O!@eQWO7+$_O!$ZQUO7+&ZO%#TQSO'#ItO%#iQSO,5@rOOQO1G3`1G3`O9ZQSO,5@rO%#iQSO,5@rO%#qQSO,5@rOOQO,5?a,5?aOOQO-E<s-E<sOOQ(CY7+'O7+'OO%#vQSO7+(yO9eQ(C[O7+(yO9ZQSO7+(yO@[QSO7+(yOOQQ7+(i7+(iO%#{Q(ChO7+(fO!&^Q,UO7+(fO%$VQ`O7+(gOOQQ7+(g7+(gO!&^Q,UO7+(gO%$^QSO'#KTO%$iQSO,5=eOOQO,5?],5?]OOQO-E<o-E<oOOQQ7+(l7+(lO%%xQWO'#HSOOQQ1G3X1G3XO!&^Q,UO1G3XO%[QUO1G3XO%&PQSO1G3XO%&[Q,UO1G3XO9eQ(C[O1G3ZO#MzQSO1G3ZO9OQSO1G3ZO!@eQWO1G3ZO!@mQ,UO1G3ZO%&jQSO'#IsO%&uQSO,5@pO%&}QWO,5@pOOQ(CW1G3[1G3[OOQQ7+$T7+$TO@[QSO7+$TO9eQ(C[O7+$TO%'YQSO7+$TO%[QUO1G6_O%[QUO1G6`O%'_Q(C[O1G6_O%'iQUO1G3cO%'pQSO1G3cO%'uQUO1G3cOOQQ7+({7+({O9eQ(C[O7+)VO`QUO7+)XOOQQ'#KZ'#KZOOQQ'#Iv'#IvO%'|QUO,5>WOOQQ,5>W,5>WO%[QUO'#HmO%(ZQSO'#HoOOQQ,5>^,5>^O9TQSO,5>^OOQQ,5>`,5>`OOQQ7+)b7+)bOOQQ7+)h7+)hOOQQ7+)l7+)lOOQQ7+)n7+)nO%(`QWO1G5oO%(tQ$IUO1G0tO%)OQSO1G0tOOQO1G/n1G/nO%)ZQ$IUO1G/nO>jQSO1G/nO!*SQUO'#DhOOQO,5>w,5>wOOQO-E<Z-E<ZOOQO,5>},5>}OOQO-E<a-E<aO!@eQWO1G/nOOQO-E<^-E<^OOQ(CY1G0Y1G0YOOQ(CY7+%r7+%rO#$}QSO7+%rOOQ(CY7+&Y7+&YO>jQSO7+&YO!@eQWO7+&YOOQO7+%u7+%uO$9`Q(CjO7+&ROOQO7+&R7+&RO%[QUO7+&RO%)eQ(C[O7+&RO!@YQ(C[O7+%uO!@eQWO7+%uO%)pQ(C[O7+&RO%*OQ(CjO7++dO%[QUO7++dO%*`QSO7++cO%*`QSO7++cOOQO1G4k1G4kO9TQSO1G4kO%*hQSO1G4kOOQO7+%z7+%zO#$}QSO<<KxO% rQbO<<KxO%*vQSO<<KxOOQQ<<Kx<<KxO!&^Q,UO<<KxO%[QUO<<KxO%+OQSO<<KxO%+ZQ(CjO1G2lO%-fQ(CjO1G2nO%/qQ(CjO1G2YO%2SQ,UO,5>xOOQO-E<[-E<[O%2^QbO,5>yO%[QUO,5>yOOQO-E<]-E<]O%2hQSO1G5qOOQ(CY<<JO<<JOO%2pQ$IUO1G0oO%4zQ$IUO1G0yO%5RQ$IUO1G0yO%7VQ$IUO1G0yO%7^Q$IUO1G0yO%9RQ$IUO1G0yO%9iQ$IUO1G0yO%;|Q$IUO1G0yO%<TQ$IUO1G0yO%>XQ$IUO1G0yO%>`Q$IUO1G0yO%@WQ$IUO1G0yO%@kQ(CjO<<JbO%ApQ$IUO1G0yO%CfQ$IUO'#J`O%EiQ$IUO1G1_O%EvQ$IUO1G0RO!*SQUO'#FmOOQO'#J{'#J{OOQO1G1q1G1qO%FQQSO1G1pO%FVQ$IUO,5?SOOOO7+'d7+'dOOOO1G/T1G/TOOQ(CY1G4p1G4pO!'vQ,UO7+([O%FaQSO,5?TO9ZQSO,5?TOOQO-E<g-E<gO%FoQSO1G6TO%FoQSO1G6TO%FwQSO1G6TO%GSQ,UO7+'tO%GdQ`O,5?VO%GnQSO,5?VO!&^Q,UO,5?VOOQO-E<i-E<iO%GsQ`O1G6UO%G}QSO1G6UOOQ(CW1G2d1G2dO$$XQSO1G2dOOQ(CW1G2c1G2cO%HVQSO1G2eO!&^Q,UO1G2eOOQ(CW1G2j1G2jO!@eQWO1G2cOCXQSO1G2dO%H[QSO1G2eO%HdQSO1G2dO!'vQ,UO7++POOQ(CY1G/]1G/]O%HoQSO1G/]OOQ(CY7+'o7+'oO%HtQ,UO7+'vO%IUQ(CjO<<KSOOQ(CY<<KS<<KSO%IxQSO1G0tO!&^Q,UO'#InO%I}QSO,5@kO!&^Q,UO1G2hOOQQ<<Gy<<GyO!@YQ(C[O<<GyO%JVQ(CjO<<IuOOQ(CY<<Iu<<IuOOQO,5?`,5?`O%JyQSO,5?`O$(sQSO,5?`OOQO-E<r-E<rO%KOQSO1G6^O%KOQSO1G6^O9ZQSO1G6^O@[QSO<<LeOOQQ<<Le<<LeO%KWQSO<<LeO9eQ(C[O<<LeOOQQ<<LQ<<LQO%#{Q(ChO<<LQOOQQ<<LR<<LRO%$VQ`O<<LRO%K]QWO'#IpO%KhQSO,5@oO!*SQUO,5@oOOQQ1G3P1G3PO%KpQUO'#JiOOQO'#Ir'#IrO9eQ(C[O'#IrO%KzQWO,5=nOOQQ,5=n,5=nO%LRQWO'#EaO%LgQSO7+(sO%LlQSO7+(sOOQQ7+(s7+(sO!&^Q,UO7+(sO%[QUO7+(sO%LtQSO7+(sOOQQ7+(u7+(uO9eQ(C[O7+(uO#MzQSO7+(uO9OQSO7+(uO!@eQWO7+(uO%MPQSO,5?_OOQO-E<q-E<qOOQO'#HV'#HVO%M[QSO1G6[O9eQ(C[O<<GoOOQQ<<Go<<GoO@[QSO<<GoO%MdQSO7++yO%MiQSO7++zO%[QUO7++yO%[QUO7++zOOQQ7+(}7+(}O%MnQSO7+(}O%MsQUO7+(}O%MzQSO7+(}OOQQ<<Lq<<LqOOQQ<<Ls<<LsOOQQ-E<t-E<tOOQQ1G3r1G3rO%NPQSO,5>XOOQQ,5>Z,5>ZO%NUQSO1G3xO9TQSO7+&`O!*SQUO7+&`OOQO7+%Y7+%YO%NZQ$IUO1G5{O>jQSO7+%YOOQ(CY<<I^<<I^OOQ(CY<<It<<ItO>jQSO<<ItOOQO<<Im<<ImO$9`Q(CjO<<ImO%[QUO<<ImOOQO<<Ia<<IaO!@YQ(C[O<<IaO%NeQ(C[O<<ImO%NpQ(CjO<= OO& QQSO<<N}OOQO7+*V7+*VO9TQSO7+*VOOQQANAdANAdO& YQSOANAdO!&^Q,UOANAdO#$}QSOANAdO% rQbOANAdO%[QUOANAdO& bQ(CjO7+'tO&#sQ(CjO7+'vO&&UQbO1G4eO&&`Q$IUO7+&ZO&&mQ$IUO,59oO&(pQ$IUO,5<eO&*sQ$IUO,5<gO&,vQ$IUO,5<uO&.lQ$IUO7+'gO&.yQ$IUO7+'hO&/WQSO,5<XOOQO7+'[7+'[O&/]Q,UO<<KvOOQO1G4o1G4oO&/dQSO1G4oO&/oQSO1G4oO&/}QSO7++oO&/}QSO7++oO!&^Q,UO1G4qO&0VQ`O1G4qO&0aQSO7++pOOQ(CW7+(O7+(OO$$XQSO7+(PO&0iQ`O7+(POOQ(CW7+'}7+'}O$$XQSO7+(OO&0pQSO7+(PO!&^Q,UO7+(POCXQSO7+(OO&0uQ,UO<<NkOOQ(CY7+$w7+$wO&1PQ`O,5?YOOQO-E<l-E<lO&1ZQ(ChO7+(SOOQQAN=eAN=eO9ZQSO1G4zOOQO1G4z1G4zO&1kQSO1G4zO&1pQSO7++xO&1pQSO7++xO9eQ(C[OANBPO@[QSOANBPOOQQANBPANBPOOQQANAlANAlOOQQANAmANAmO&1xQSO,5?[OOQO-E<n-E<nO&2TQ$IUO1G6ZO&4eQbO'#CgOOQO,5?^,5?^OOQO-E<p-E<pOOQQ1G3Y1G3YO%KpQUO,5<yOOQQ<<L_<<L_O!&^Q,UO<<L_O%LgQSO<<L_O&4oQSO<<L_O%[QUO<<L_OOQQ<<La<<LaO9eQ(C[O<<LaO#MzQSO<<LaO9OQSO<<LaO&4wQWO1G4yO&5SQSO7++vOOQQAN=ZAN=ZO9eQ(C[OAN=ZOOQQ<= e<= eOOQQ<= f<= fO&5[QSO<= eO&5aQSO<= fOOQQ<<Li<<LiO&5fQSO<<LiO&5kQUO<<LiOOQQ1G3s1G3sO>jQSO7+)dO&5rQSO<<IzO&5}Q$IUO<<IzOOQO<<Ht<<HtOOQ(CYAN?`AN?`OOQOAN?XAN?XO$9`Q(CjOAN?XOOQOAN>{AN>{O%[QUOAN?XOOQO<<Mq<<MqOOQQG27OG27OO!&^Q,UOG27OO#$}QSOG27OO&6XQSOG27OO% rQbOG27OO&6aQ$IUO<<JbO&6nQ$IUO1G2YO&8dQ$IUO1G2lO&:gQ$IUO1G2nO&<jQ$IUO<<KSO&<wQ$IUO<<IuOOQO1G1s1G1sO!'vQ,UOANAbOOQO7+*Z7+*ZO&=UQSO7+*ZO&=aQSO<= ZO&=iQ`O7+*]OOQ(CW<<Kk<<KkO$$XQSO<<KkOOQ(CW<<Kj<<KjO&=sQ`O<<KkO$$XQSO<<KjOOQO7+*f7+*fO9ZQSO7+*fO&=zQSO<= dOOQQG27kG27kO9eQ(C[OG27kO!*SQUO1G4vO&>SQSO7++uO%LgQSOANAyOOQQANAyANAyO!&^Q,UOANAyO&>[QSOANAyOOQQANA{ANA{O9eQ(C[OANA{O#MzQSOANA{OOQO'#HW'#HWOOQO7+*e7+*eOOQQG22uG22uOOQQANEPANEPOOQQANEQANEQOOQQANBTANBTO&>dQSOANBTOOQQ<<MO<<MOO!*SQUOAN?fOOQOG24sG24sO$9`Q(CjOG24sO#$}QSOLD,jOOQQLD,jLD,jO!&^Q,UOLD,jO&>iQSOLD,jO&>qQ$IUO7+'tO&@gQ$IUO7+'vO&B]Q,UOG26|OOQO<<Mu<<MuOOQ(CWANAVANAVO$$XQSOANAVOOQ(CWANAUANAUOOQO<<NQ<<NQOOQQLD-VLD-VO&BmQ$IUO7+*bOOQQG27eG27eO%LgQSOG27eO!&^Q,UOG27eOOQQG27gG27gO9eQ(C[OG27gOOQQG27oG27oO&BwQ$IUOG25QOOQOLD*_LD*_OOQQ!$(!U!$(!UO#$}QSO!$(!UO!&^Q,UO!$(!UO&CRQ(CjOG26|OOQ(CWG26qG26qOOQQLD-PLD-PO%LgQSOLD-POOQQLD-RLD-ROOQQ!)9Ep!)9EpO#$}QSO!)9EpOOQQ!$(!k!$(!kOOQQ!.K;[!.K;[O&EdQ$IUOG26|O!*SQUO'#DwO1PQSO'#EUO&GYQbO'#JeO!*SQUO'#DoO&GaQUO'#D{O&GhQbO'#CgO&JOQbO'#CgO!*SQUO'#D}O&J`QUO,5;TO!*SQUO,5;_O!*SQUO,5;_O!*SQUO,5;_O!*SQUO,5;_O!*SQUO,5;_O!*SQUO,5;_O!*SQUO,5;_O!*SQUO,5;_O!*SQUO,5;_O!*SQUO,5;_O!*SQUO,5;_O!*SQUO'#IhO&LcQSO,5<dO&LkQ,UO,5;_O&NOQ,UO,5;_O!*SQUO,5;sO1SQSO'#DTO1SQSO'#DTO!&^Q,UO'#FyO&LkQ,UO'#FyO!&^Q,UO'#F{O&LkQ,UO'#F{O!&^Q,UO'#GZO&LkQ,UO'#GZO!*SQUO,5:gO!*SQUO,5@aO&J`QUO1G0oO&NVQ$IUO'#CgO!*SQUO1G1{O!&^Q,UO,5=QO&LkQ,UO,5=QO!&^Q,UO,5=SO&LkQ,UO,5=SO!&^Q,UO,5<nO&LkQ,UO,5<nO&J`QUO1G1|O!*SQUO7+&vO!&^Q,UO1G2YO&LkQ,UO1G2YO!&^Q,UO1G2[O&LkQ,UO1G2[O&J`QUO7+'hO&J`QUO7+&ZO!&^Q,UOANAbO&LkQ,UOANAbO&NaQSO'#EiO&NfQSO'#EiO&NnQSO'#FXO&NsQSO'#EsO&NxQSO'#JuO' TQSO'#JsO' `QSO,5;TO' eQ,UO,5<aO' lQSO'#GSO' qQSO'#GSO' vQSO,5<bO'!OQSO,5;TO'!WQ$IUO1G1[O'!_QSO,5<nO'!dQSO,5<nO'!iQSO,5<pO'!nQSO,5<pO'!sQSO1G1|O'!xQSO1G0oO'!}Q,UO<<KvO'#UQ,UO<<KvO7hQ,UO'#FwO9OQSO'#FvOAVQSO'#EhO!*SQUO,5;pO!2|QSO'#GSO!2|QSO'#GSO!2|QSO'#GUO!2|QSO'#GUO!'vQ,UO7+([O!'vQ,UO7+([O$KbQ`O1G2pO$KbQ`O1G2pO!&^Q,UO,5=UO!&^Q,UO,5=U",
  stateData: "'$_~O'oOS'pOSROS'qRQ~OPYOQYOW!VO_qObzOcyOjkOlYOmkOnkOtkOvYOxYO}WO!RkO!SkO!YXO!duO!iZO!lYO!mYO!nYO!pvO!rwO!uxO!y]O#q!PO$R|O$VfO%a}O%c!QO%e!OO%f!OO%g!OO%j!RO%l!SO%o!TO%p!TO%r!UO&O!WO&U!XO&W!YO&Y!ZO&[![O&_!]O&e!^O&k!_O&m!`O&o!aO&q!bO&s!cO'vSO'xTO'{UO(TVO(c[O(piO~OUtO~P`OPYOQYOb!jOc!iOjkOlYOmkOnkOtkOvYOxYO}WO!RkO!SkO!Y!eO!duO!iZO!lYO!mYO!nYO!pvO!r!gO!u!hO$R!kO$VfO'v!dO'xTO'{UO(TVO(c[O(piO~O_!vOm!nO}!oO!]!xO!^!uO!_!uO!y9rO!}!pO#O!pO#P!wO#Q!pO#R!pO#U!yO#V!yO'w!lO'xTO'{UO(W!mO(c!sO~O'q!zO~OPZXYZX_ZXlZXzZX{ZX}ZX!WZX!fZX!gZX!iZX!mZX#YZX#edX#hZX#iZX#jZX#kZX#lZX#mZX#nZX#oZX#pZX#rZX#tZX#vZX#wZX#|ZX'mZX(TZX(dZX(kZX(lZX~O!b${X~P(qO]!|O'x#OO'y!|O'z#OO~O]#PO'z#OO'{#OO'|#PO~Or#RO!P#SO(U#SO(V#UO~OPYOQYOb!jOc!iOjkOlYOmkOnkOtkOvYOxYO}WO!RkO!SkO!Y!eO!duO!iZO!lYO!mYO!nYO!pvO!r!gO!u!hO$R!kO$VfO'v9vO'xTO'{UO(TVO(c[O(piO~O!V#YO!W#VO!T(ZP!T(hP~P+}O!X#bO~P`OPYOQYOb!jOc!iOlYOmkOnkOtkOvYOxYO}WO!RkO!SkO!Y!eO!duO!iZO!lYO!mYO!nYO!pvO!r!gO!u!hO$R!kO$VfO'xTO'{UO(TVO(c[O(piO~Oj#lO!V#hO!y]O#c#kO#d#hO'v9wO!h(eP~P.iO!i#nO'v#mO~O!u#rO!y]O%a#sO~O#e#tO~O!b#uO#e#tO~OP$]OY$dOl$QOz#yO{#zO}#{O!W$aO!f$SO!g#wO!i#xO!m$]O#h$OO#i$PO#j$PO#k$PO#l$RO#m$SO#n$SO#o$cO#p$SO#r$TO#t$VO#v$XO#w$YO(TVO(d$ZO(k#|O(l#}O~O_(XX'm(XX'k(XX!h(XX!T(XX!Y(XX%b(XX!b(XX~P1qO#Y$eO#|$eOP(YXY(YXl(YXz(YX{(YX}(YX!W(YX!f(YX!i(YX!m(YX#h(YX#i(YX#j(YX#k(YX#l(YX#m(YX#n(YX#o(YX#p(YX#r(YX#t(YX#v(YX#w(YX(T(YX(d(YX(k(YX(l(YX!Y(YX%b(YX~O_(YX!g(YX'm(YX'k(YX!T(YX!h(YXp(YX!b(YX~P4XO#Y$eO~O$X$gO$Z$fO$b$lO~O!Y$mO$VfO$e$nO$g$pO~Oj%SOl$tOm$sOn$sOt%TOv%UOx%VO}${O!Y$|O!d%[O!i$xO#d%]O$R%YO$n%WO$p%XO$s%ZO'v$rO'xTO'{UO(P%RO(T$uOe(QP~O!i%^O~O}%aO!Y%bO'v%`O~O!b%fO~O_%gO'm%gO~O'w!lO~P%[O%g%nO~P%[O!i%^O'v%`O'w!lO(P%RO~Oc%uO!i%^O'v%`O~O#p$SO~Oz%zO!Y%wO!i%yO%c%}O'v%`O'w!lO'xTO'{UO^(yP~O!u#rO~O%l&PO}(uX!Y(uX'v(uX~O'v&QO~O!r&VO#q!PO%c!QO%e!OO%f!OO%g!OO%j!RO%l!SO%o!TO%p!TO~Ob&[Oc&ZO!u&XO%a&YO%t&WO~P;rOb&_OcyO!Y&^O!r&VO!uxO!y]O#q!PO%a}O%e!OO%f!OO%g!OO%j!RO%l!SO%o!TO%p!TO%r!UO~O`&bO#Y&eO%c&`O'w!lO~P<wO!i&fO!r&jO~O!i#nO~O!YXO~O_%gO'l&rO'm%gO~O_%gO'l&uO'm%gO~O_%gO'l&wO'm%gO~O'kZX!TZXpZX!hZX&SZX!YZX%bZX!bZX~P(qO!]'UO!^&}O!_&}O'w!lO'xTO'{UO~Om&{O}&zO!V'OO(W&yO!X([P!X(jP~P@OOh'XO!Y'VO'v%`O~Oc'^O!i%^O'v%`O~Oz%zO!i%yO~Om!nO}!oO!y9rO!}!pO#O!pO#Q!pO#R!pO'w!lO'xTO'{UO(W!mO(c!sO~O!]'dO!^'cO!_'cO#P!pO#U'eO#V'eO~PAjO_%gO!b#uO!i%^O'm%gO(P%RO(d'gO~O!m'kO#Y'iO~PBxOm!nO}!oO'xTO'{UO(W!mO(c!sO~O!YXOm(aX}(aX!](aX!^(aX!_(aX!y(aX!}(aX#O(aX#P(aX#Q(aX#R(aX#U(aX#V(aX'w(aX'x(aX'{(aX(W(aX(c(aX~O!^'cO!_'cO'w!lO~PChO'r'oO's'oO't'qO~O]!|O'x'sO'y!|O'z'sO~O]#PO'z'sO'{'sO'|#PO~Or#RO!P#SO(U#SO(V'wO~O!V'yO!T'OX!T'UX!W'OX!W'UX~P+}O!W'{O!T(ZX~OP$]OY$dOl$QOz#yO{#zO}#{O!W'{O!f$SO!g#wO!i#xO!m$]O#h$OO#i$PO#j$PO#k$PO#l$RO#m$SO#n$SO#o$cO#p$SO#r$TO#t$VO#v$XO#w$YO(TVO(d$ZO(k#|O(l#}O~O!T(ZX~PG[O!T(QO~O!T(gX!W(gX!b(gX!h(gX(d(gX~O#Y(gX#e#^X!X(gX~PIbO#Y(RO!T(iX!W(iX~O!W(SO!T(hX~O!T(VO~O#Y$eO~PIbO!X(WO~P`Oz#yO{#zO}#{O!g#wO!i#xO(TVOP!kaY!kal!ka!W!ka!f!ka!m!ka#h!ka#i!ka#j!ka#k!ka#l!ka#m!ka#n!ka#o!ka#p!ka#r!ka#t!ka#v!ka#w!ka(d!ka(k!ka(l!ka~O_!ka'm!ka'k!ka!T!ka!h!kap!ka!Y!ka%b!ka!b!ka~PJxO!h(XO~O!b#uO#Y(YO(d'gO!W(fX_(fX'm(fX~O!h(fX~PMhO}%aO!Y%bO!y]O#c(_O#d(^O'v%`O~O!W(`O!h(eX~O!h(bO~O}%aO!Y%bO#d(^O'v%`O~OP(YXY(YXl(YXz(YX{(YX}(YX!W(YX!f(YX!g(YX!i(YX!m(YX#h(YX#i(YX#j(YX#k(YX#l(YX#m(YX#n(YX#o(YX#p(YX#r(YX#t(YX#v(YX#w(YX(T(YX(d(YX(k(YX(l(YX~O!b#uO!h(YX~P! UOz(cO{(dO!g#wO!i#xO!y!xa}!xa~O!u!xa%a!xa!Y!xa#c!xa#d!xa'v!xa~P!#YO!u(hO~OPYOQYOb!jOc!iOjkOlYOmkOnkOtkOvYOxYO}WO!RkO!SkO!YXO!duO!iZO!lYO!mYO!nYO!pvO!r!gO!u!hO$R!kO$VfO'v!dO'xTO'{UO(TVO(c[O(piO~Oj%SOl$tOm$sOn$sOt%TOv%UOx:[O}${O!Y$|O!d;fO!i$xO#d:bO$R%YO$n:^O$p:`O$s%ZO'v(lO'xTO'{UO(P%RO(T$uO~O#e(nO~Oj%SOl$tOm$sOn$sOt%TOv%UOx%VO}${O!Y$|O!d%[O!i$xO#d%]O$R%YO$n%WO$p%XO$s%ZO'v(lO'xTO'{UO(P%RO(T$uO~Oe(^P~P!'vO!V(rO!h(_P~P%[O(W(tO(c[O~O}(vO!i#xO(W(tO(c[O~OP9qOQ9qOb;bOc!iOjkOl9qOmkOnkOtkOv9qOx9qO}WO!RkO!SkO!Y!eO!d9tO!iZO!l9qO!m9qO!n9qO!p9uO!r9xO!u!hO$R!kO$VfO'v)UO'xTO'{UO(TVO(c[O(p;`O~O{)XO!i#xO~O!W$aO_$la'm$la'k$la!h$la!T$la!Y$la%b$la!b$la~O#q)]O~P!&^Oz)`O!b)_O!Y$YX$U$YX$X$YX$Z$YX$b$YX~O!b)_O!Y(mX$U(mX$X(mX$Z(mX$b(mX~Oz)`O~P!-lOz)`O!Y(mX$U(mX$X(mX$Z(mX$b(mX~O!Y)bO$U)fO$X)aO$Z)aO$b)gO~O!V)jO~P!*SO$X$gO$Z$fO$b)nO~Oh$tXz$tX}$tX!g$tX(k$tX(l$tX~OegXe$tXhgX!WgX#YgX~P!/bOm)pO~Or)qO(U)rO(V)tO~Oh)}Oz)vO})wO(k)yO(l){O~Oe)uO~P!0kOe*OO~Oj%SOl$tOm$sOn$sOt%TOv%UOx:[O}${O!Y$|O!d;fO!i$xO#d:bO$R%YO$n:^O$p:`O$s%ZO'xTO'{UO(P%RO(T$uO~O!V*SO'v*PO!h(qP~P!1YO#e*UO~O!i*VO~O!V*[O'v*XO!T(rP~P!1YOl*hO}*`O!]*fO!^*_O!_*_O!i*VO#U*gO%X*bO'w!lO(W!mO~O!X*eO~P!3`O!g#wOh(SXz(SX}(SX(k(SX(l(SX!W(SX#Y(SX~Oe(SX#z(SX~P!4XOh*kO#Y*jOe(RX!W(RX~O!W*lOe(QX~O'v&QOe(QP~O!i*sO~O'v(lO~Oj*wO}%aO!V#hO!Y%bO!y]O#c#kO#d#hO'v%`O!h(eP~O!b#uO#e*xO~O}%aO!V*zO!W(SO!Y%bO'v%`O!T(hP~Om'RO}*|O!V*{O'xTO'{UO(W(tO~O!X(jP~P!7SO!W*}O_(vX'm(vX~OP$]OY$dOl$QOz#yO{#zO}#{O!f$SO!g#wO!i#xO!m$]O#h$OO#i$PO#j$PO#k$PO#l$RO#m$SO#n$SO#o$cO#p$SO#r$TO#t$VO#v$XO#w$YO(TVO(d$ZO(k#|O(l#}O~O_!ca!W!ca'm!ca'k!ca!T!ca!h!cap!ca!Y!ca%b!ca!b!ca~P!7zOz#yO{#zO}#{O!g#wO!i#xO(TVOP!oaY!oal!oa!W!oa!f!oa!m!oa#h!oa#i!oa#j!oa#k!oa#l!oa#m!oa#n!oa#o!oa#p!oa#r!oa#t!oa#v!oa#w!oa(d!oa(k!oa(l!oa~O_!oa'm!oa'k!oa!T!oa!h!oap!oa!Y!oa%b!oa!b!oa~P!:eOz#yO{#zO}#{O!g#wO!i#xO(TVOP!qaY!qal!qa!W!qa!f!qa!m!qa#h!qa#i!qa#j!qa#k!qa#l!qa#m!qa#n!qa#o!qa#p!qa#r!qa#t!qa#v!qa#w!qa(d!qa(k!qa(l!qa~O_!qa'm!qa'k!qa!T!qa!h!qap!qa!Y!qa%b!qa!b!qa~P!=OOh+WO!Y'VO%b+VO(P%RO~O!b+YO_(OX!Y(OX'm(OX!W(OX~O_%gO!YXO'm%gO~O!i%^O(P%RO~O!i%^O'v%`O(P%RO~O!b#uO#e(nO~O%c+fO'v+bO'xTO'{UO!X(zP~O!W+gO^(yX~OY+kO~O^+lO~O!Y%wO'v%`O'w!lO^(yP~O#Y+qO(P%RO~Oh+tO!Y$|O(P%RO~O!Y+vO~Oz+xO!YXO~O%g%nO~O!u+}O~Oc,SO~O'v#mO!X(xP~Oc%uO~O%c!QO'v&QO~P<wOY,YO^,XO~OPYOQYObzOcyOjkOlYOmkOnkOtkOvYOxYO}WO!RkO!SkO!duO!iZO!lYO!mYO!nYO!pvO!uxO!y]O$VfO%a}O'xTO'{UO(TVO(c[O(piO~O!Y!eO!r!gO$R!kO'v!dO~P!CuO^,XO_%gO'm%gO~OPYOQYOb!jOc!iOjkOlYOmkOnkOtkOvYOxYO}WO!RkO!SkO!Y!eO!duO!iZO!lYO!mYO!nYO!pvO!u!hO$R!kO$VfO'v!dO'xTO'{UO(TVO(c[O(piO~O_,_O!rwO#q!OO%e!OO%f!OO%g!OO~P!F_O!i&fO~O&U,eO~O!Y,gO~O&g,iO&i,jOP&daQ&daW&da_&dab&dac&daj&dal&dam&dan&dat&dav&dax&da}&da!R&da!S&da!Y&da!d&da!i&da!l&da!m&da!n&da!p&da!r&da!u&da!y&da#q&da$R&da$V&da%a&da%c&da%e&da%f&da%g&da%j&da%l&da%o&da%p&da%r&da&O&da&U&da&W&da&Y&da&[&da&_&da&e&da&k&da&m&da&o&da&q&da&s&da'k&da'v&da'x&da'{&da(T&da(c&da(p&da!X&da&]&da`&da&b&da~O'v,oO~O!W|X!W!`X!X|X!X!`X!b|X!b!`X!i!`X#Y|X(P!`X~O!b,tO#Y,sO!W#bX!W(]X!X#bX!X(]X!b(]X!i(]X(P(]X~O!b,vO!i%^O(P%RO!W![X!X![X~Om!nO}!oO'xTO'{UO(W!mO~OP9qOQ9qOb;bOc!iOjkOl9qOmkOnkOtkOv9qOx9qO}WO!RkO!SkO!Y!eO!d9tO!iZO!l9qO!m9qO!n9qO!p9uO!r9xO!u!hO$R!kO$VfO'xTO'{UO(TVO(c[O(p;`O~O'v:gO~P# eO!W,zO!X([X~O!X,|O~O!b,tO#Y,sO!W#bX!X#bX~O!W,}O!X(jX~O!X-PO~O!^-QO!_-QO'w!lO~P# SO!X-TO~P'_Oh-WO!Y'VO~O!T-]O~Om!xa!]!xa!^!xa!_!xa!}!xa#O!xa#P!xa#Q!xa#R!xa#U!xa#V!xa'w!xa'x!xa'{!xa(W!xa(c!xa~P!#YO!m-bO#Y-`O~PBxO!^-dO!_-dO'w!lO~PChO_%gO#Y-`O'm%gO~O_%gO!b#uO#Y-`O'm%gO~O_%gO!b#uO!m-bO#Y-`O'm%gO(d'gO~O'r'oO's'oO't-iO~Op-jO~O!T'Oa!W'Oa~P!7zO!V-nO!T'OX!W'OX~P%[O!W'{O!T(Za~O!T(Za~PG[O!W(SO!T(ha~O}%aO!V-rO!Y%bO'v%`O!T'UX!W'UX~O#Y-tO!W(fa!h(fa_(fa'm(fa~O!b#uO~P#)kO!W(`O!h(ea~O}%aO!Y%bO#d-xO'v%`O~Oj-}O}%aO!V-zO!Y%bO!y]O#c-|O#d-zO'v%`O!W'XX!h'XX~O{.RO!i#xO~Oh.UO!Y'VO%b.TO(P%RO~O_#]i!W#]i'm#]i'k#]i!T#]i!h#]ip#]i!Y#]i%b#]i!b#]i~P!7zOh;lOz)vO})wO(k)yO(l){O~O#e#Xa_#Xa#Y#Xa'm#Xa!W#Xa!h#Xa!Y#Xa!T#Xa~P#,gO#e(SXP(SXY(SX_(SXl(SX{(SX!f(SX!i(SX!m(SX#h(SX#i(SX#j(SX#k(SX#l(SX#m(SX#n(SX#o(SX#p(SX#r(SX#t(SX#v(SX#w(SX'm(SX(T(SX(d(SX!h(SX!T(SX'k(SXp(SX!Y(SX%b(SX!b(SX~P!4XO!W._Oe(^X~P!0kOe.aO~O!W.bO!h(_X~P!7zO!h.eO~O!T.gO~OP$]Oz#yO{#zO}#{O!g#wO!i#xO!m$]O(TVOY#gi_#gil#gi!W#gi!f#gi#i#gi#j#gi#k#gi#l#gi#m#gi#n#gi#o#gi#p#gi#r#gi#t#gi#v#gi#w#gi'm#gi(d#gi(k#gi(l#gi'k#gi!T#gi!h#gip#gi!Y#gi%b#gi!b#gi~O#h#gi~P#0cO#h$OO~P#0cOP$]Oz#yO{#zO}#{O!g#wO!i#xO!m$]O#h$OO#i$PO#j$PO#k$PO(TVOY#gi_#gi!W#gi!f#gi#l#gi#m#gi#n#gi#o#gi#p#gi#r#gi#t#gi#v#gi#w#gi'm#gi(d#gi(k#gi(l#gi'k#gi!T#gi!h#gip#gi!Y#gi%b#gi!b#gi~Ol#gi~P#3TOl$QO~P#3TOP$]Ol$QOz#yO{#zO}#{O!g#wO!i#xO!m$]O#h$OO#i$PO#j$PO#k$PO#l$RO(TVO_#gi!W#gi#r#gi#t#gi#v#gi#w#gi'm#gi(d#gi(k#gi(l#gi'k#gi!T#gi!h#gip#gi!Y#gi%b#gi!b#gi~OY#gi!f#gi#m#gi#n#gi#o#gi#p#gi~P#5uOY$dO!f$SO#m$SO#n$SO#o$cO#p$SO~P#5uOP$]OY$dOl$QOz#yO{#zO}#{O!f$SO!g#wO!i#xO!m$]O#h$OO#i$PO#j$PO#k$PO#l$RO#m$SO#n$SO#o$cO#p$SO#r$TO(TVO_#gi!W#gi#t#gi#v#gi#w#gi'm#gi(d#gi(l#gi'k#gi!T#gi!h#gip#gi!Y#gi%b#gi!b#gi~O(k#gi~P#8vO(k#|O~P#8vOP$]OY$dOl$QOz#yO{#zO}#{O!f$SO!g#wO!i#xO!m$]O#h$OO#i$PO#j$PO#k$PO#l$RO#m$SO#n$SO#o$cO#p$SO#r$TO#t$VO(TVO(k#|O_#gi!W#gi#v#gi#w#gi'm#gi(d#gi'k#gi!T#gi!h#gip#gi!Y#gi%b#gi!b#gi~O(l#gi~P#;hO(l#}O~P#;hOP$]OY$dOl$QOz#yO{#zO}#{O!f$SO!g#wO!i#xO!m$]O#h$OO#i$PO#j$PO#k$PO#l$RO#m$SO#n$SO#o$cO#p$SO#r$TO#t$VO#v$XO(TVO(k#|O(l#}O~O_#gi!W#gi#w#gi'm#gi(d#gi'k#gi!T#gi!h#gip#gi!Y#gi%b#gi!b#gi~P#>YOPZXYZXlZXzZX{ZX}ZX!fZX!gZX!iZX!mZX#YZX#edX#hZX#iZX#jZX#kZX#lZX#mZX#nZX#oZX#pZX#rZX#tZX#vZX#wZX#|ZX(TZX(dZX(kZX(lZX!WZX!XZX~O#zZX~P#@sOP$]OY:YOl9|Oz#yO{#zO}#{O!f:OO!g#wO!i#xO!m$]O#h9zO#i9{O#j9{O#k9{O#l9}O#m:OO#n:OO#o:XO#p:OO#r:PO#t:RO#v:TO#w:UO(TVO(d$ZO(k#|O(l#}O~O#z.iO~P#CQO#Y:ZO#|:ZO#z(YX!X(YX~P! UO_'[a!W'[a'm'[a'k'[a!h'[a!T'[ap'[a!Y'[a%b'[a!b'[a~P!7zOP#giY#gi_#gil#gi{#gi!W#gi!f#gi!g#gi!i#gi!m#gi#h#gi#i#gi#j#gi#k#gi#l#gi#m#gi#n#gi#o#gi#p#gi#r#gi#t#gi#v#gi#w#gi'm#gi(T#gi(d#gi'k#gi!T#gi!h#gip#gi!Y#gi%b#gi!b#gi~P#,gO_#{i!W#{i'm#{i'k#{i!T#{i!h#{ip#{i!Y#{i%b#{i!b#{i~P!7zO$X.nO$Z.nO~O$X.oO$Z.oO~O!b)_O#Y.pO!Y$_X$U$_X$X$_X$Z$_X$b$_X~O!V.qO~O!Y)bO$U.sO$X)aO$Z)aO$b.tO~O!W:VO!X(XX~P#CQO!X.uO~O!b)_O$b(mX~O$b.wO~Or)qO(U)rO(V.zO~O!T/OO~P!&^O!WdX!bdX!hdX!h$tX(ddX~P!/bO!h/UO~P#,gO!W/VO!b#uO(d'gO!h(qX~O!h/[O~O!V*SO'v%`O!h(qP~O#e/^O~O!T$tX!W$tX!b${X~P!/bO!W/_O!T(rX~P#,gO!b/aO~O!T/cO~Ol/gO!b#uO!i%^O(P%RO(d'gO~O'v/iO~O!b+YO~O_%gO!W/mO'm%gO~O!X/oO~P!3`O!^/pO!_/pO'w!lO(W!mO~O}/rO(W!mO~O#U/sO~O'v&QOe'aX!W'aX~O!W*lOe(Qa~Oe/xO~Oz/yO{/yO}/zOhwa(kwa(lwa!Wwa#Ywa~Oewa#zwa~P$ hOz)vO})wOh$ma(k$ma(l$ma!W$ma#Y$ma~Oe$ma#z$ma~P$!^Oz)vO})wOh$oa(k$oa(l$oa!W$oa#Y$oa~Oe$oa#z$oa~P$#PO#e/|O~Oe$}a!W$}a#Y$}a#z$}a~P!0kO!b#uO~O#e0PO~O!W*}O_(va'm(va~Oz#yO{#zO}#{O!g#wO!i#xO(TVOP!oiY!oil!oi!W!oi!f!oi!m!oi#h!oi#i!oi#j!oi#k!oi#l!oi#m!oi#n!oi#o!oi#p!oi#r!oi#t!oi#v!oi#w!oi(d!oi(k!oi(l!oi~O_!oi'm!oi'k!oi!T!oi!h!oip!oi!Y!oi%b!oi!b!oi~P$$nOh.UO!Y'VO%b.TO~Oj0ZO'v0YO~P!1]O!b+YO_(Oa!Y(Oa'm(Oa!W(Oa~O#e0aO~OYZX!WdX!XdX~O!W0bO!X(zX~O!X0dO~OY0eO~O'v+bO'xTO'{UO~O!Y%wO'v%`O^'iX!W'iX~O!W+gO^(ya~O!h0jO~P!7zOY0mO~O^0nO~O#Y0qO~Oh0tO!Y$|O~O(W(tO!X(wP~Oh0}O!Y0zO%b0|O(P%RO~OY1XO!W1VO!X(xX~O!X1YO~O^1[O_%gO'm%gO~O'v#mO'xTO'{UO~O#Y$eO#|$eOP(YXY(YXl(YXz(YX{(YX}(YX!W(YX!f(YX!i(YX!m(YX#h(YX#i(YX#j(YX#k(YX#l(YX#m(YX#n(YX#o(YX#r(YX#t(YX#v(YX#w(YX(T(YX(d(YX(k(YX(l(YX~O#p1_O&S1`O_(YX!g(YX~P$+dO#Y$eO#p1_O&S1`O~O_1bO~P%[O_1dO~O&]1gOP&ZiQ&ZiW&Zi_&Zib&Zic&Zij&Zil&Zim&Zin&Zit&Ziv&Zix&Zi}&Zi!R&Zi!S&Zi!Y&Zi!d&Zi!i&Zi!l&Zi!m&Zi!n&Zi!p&Zi!r&Zi!u&Zi!y&Zi#q&Zi$R&Zi$V&Zi%a&Zi%c&Zi%e&Zi%f&Zi%g&Zi%j&Zi%l&Zi%o&Zi%p&Zi%r&Zi&O&Zi&U&Zi&W&Zi&Y&Zi&[&Zi&_&Zi&e&Zi&k&Zi&m&Zi&o&Zi&q&Zi&s&Zi'k&Zi'v&Zi'x&Zi'{&Zi(T&Zi(c&Zi(p&Zi!X&Zi`&Zi&b&Zi~O`1mO!X1kO&b1lO~P`O!YXO!i1oO~O&i,jOP&diQ&diW&di_&dib&dic&dij&dil&dim&din&dit&div&dix&di}&di!R&di!S&di!Y&di!d&di!i&di!l&di!m&di!n&di!p&di!r&di!u&di!y&di#q&di$R&di$V&di%a&di%c&di%e&di%f&di%g&di%j&di%l&di%o&di%p&di%r&di&O&di&U&di&W&di&Y&di&[&di&_&di&e&di&k&di&m&di&o&di&q&di&s&di'k&di'v&di'x&di'{&di(T&di(c&di(p&di!X&di&]&di`&di&b&di~O!T1uO~O!W![a!X![a~P#CQOm!nO}!oO!V1{O(W!mO!W'PX!X'PX~P@OO!W,zO!X([a~O!W'VX!X'VX~P!7SO!W,}O!X(ja~O!X2SO~P'_O_%gO#Y2]O'm%gO~O_%gO!b#uO#Y2]O'm%gO~O_%gO!b#uO!m2aO#Y2]O'm%gO(d'gO~O_%gO'm%gO~P!7zO!W$aOp$la~O!T'Oi!W'Oi~P!7zO!W'{O!T(Zi~O!W(SO!T(hi~O!T(ii!W(ii~P!7zO!W(fi!h(fi_(fi'm(fi~P!7zO#Y2cO!W(fi!h(fi_(fi'm(fi~O!W(`O!h(ei~O}%aO!Y%bO!y]O#c2hO#d2gO'v%`O~O}%aO!Y%bO#d2gO'v%`O~Oh2oO!Y'VO%b2nO~Oh2oO!Y'VO%b2nO(P%RO~O#ewaPwaYwa_walwa!fwa!gwa!iwa!mwa#hwa#iwa#jwa#kwa#lwa#mwa#nwa#owa#pwa#rwa#twa#vwa#wwa'mwa(Twa(dwa!hwa!Twa'kwapwa!Ywa%bwa!bwa~P$ hO#e$maP$maY$ma_$mal$ma{$ma!f$ma!g$ma!i$ma!m$ma#h$ma#i$ma#j$ma#k$ma#l$ma#m$ma#n$ma#o$ma#p$ma#r$ma#t$ma#v$ma#w$ma'm$ma(T$ma(d$ma!h$ma!T$ma'k$map$ma!Y$ma%b$ma!b$ma~P$!^O#e$oaP$oaY$oa_$oal$oa{$oa!f$oa!g$oa!i$oa!m$oa#h$oa#i$oa#j$oa#k$oa#l$oa#m$oa#n$oa#o$oa#p$oa#r$oa#t$oa#v$oa#w$oa'm$oa(T$oa(d$oa!h$oa!T$oa'k$oap$oa!Y$oa%b$oa!b$oa~P$#PO#e$}aP$}aY$}a_$}al$}a{$}a!W$}a!f$}a!g$}a!i$}a!m$}a#h$}a#i$}a#j$}a#k$}a#l$}a#m$}a#n$}a#o$}a#p$}a#r$}a#t$}a#v$}a#w$}a'm$}a(T$}a(d$}a!h$}a!T$}a'k$}a#Y$}ap$}a!Y$}a%b$}a!b$}a~P#,gO_#]q!W#]q'm#]q'k#]q!T#]q!h#]qp#]q!Y#]q%b#]q!b#]q~P!7zOe'QX!W'QX~P!'vO!W._Oe(^a~O!V2wO!W'RX!h'RX~P%[O!W.bO!h(_a~O!W.bO!h(_a~P!7zO!T2zO~O#z!ka!X!ka~PJxO#z!ca!W!ca!X!ca~P#CQO#z!oa!X!oa~P!:eO#z!qa!X!qa~P!=OO!Y3^O$VfO$`3_O~O!X3cO~Op3dO~P#,gO_$iq!W$iq'm$iq'k$iq!T$iq!h$iqp$iq!Y$iq%b$iq!b$iq~P!7zO!T3eO~P#,gOz)vO})wO(l){Oh%Yi(k%Yi!W%Yi#Y%Yi~Oe%Yi#z%Yi~P$I|Oz)vO})wOh%[i(k%[i(l%[i!W%[i#Y%[i~Oe%[i#z%[i~P$JoO(d$ZO~P#,gO!V3hO'v%`O!W']X!h']X~O!W/VO!h(qa~O!W/VO!b#uO!h(qa~O!W/VO!b#uO(d'gO!h(qa~Oe$vi!W$vi#Y$vi#z$vi~P!0kO!V3pO'v*XO!T'_X!W'_X~P!1YO!W/_O!T(ra~O!W/_O!T(ra~P#,gO!b#uO#p3xO~Ol3{O!b#uO(d'gO~Oe(Ri!W(Ri~P!0kO#Y4OOe(Ri!W(Ri~P!0kO!h4RO~O_$jq!W$jq'm$jq'k$jq!T$jq!h$jqp$jq!Y$jq%b$jq!b$jq~P!7zO!T4VO~O!W4WO!Y(sX~P#,gO!g#wO~P4XO_$tX!Y$tX%VZX'm$tX!W$tX~P!/bO%V4YO_iXhiXziX}iX!YiX'miX(kiX(liX!WiX~O%V4YO~O%c4aO'v+bO'xTO'{UO!W'hX!X'hX~O!W0bO!X(za~OY4eO~O^4fO~O_%gO'm%gO~P#,gO!Y$|O~P#,gO!W4nO#Y4pO!X(wX~O!X4qO~Om!nO}4rO!]!xO!^!uO!_!uO!y9rO!}!pO#O!pO#P!pO#Q!pO#R!pO#U4wO#V!yO'w!lO'xTO'{UO(W!mO(c!sO~O!X4vO~P%$nOh4|O!Y0zO%b4{O~Oh4|O!Y0zO%b4{O(P%RO~O'v#mO!W'gX!X'gX~O!W1VO!X(xa~O'xTO'{UO(W5VO~O^5ZO~O#p5^O&S5_O~PMhO!h5`O~P%[O_5bO~O_5bO~P%[O`1mO!X5gO&b1lO~P`O!b5iO~O!b5kO!W(]i!X(]i!b(]i!i(]i(P(]i~O!W#bi!X#bi~P#CQO#Y5lO!W#bi!X#bi~O!W![i!X![i~P#CQO_%gO#Y5uO'm%gO~O_%gO!b#uO#Y5uO'm%gO~O!W(fq!h(fq_(fq'm(fq~P!7zO!W(`O!h(eq~O}%aO!Y%bO#d5|O'v%`O~O!Y'VO%b6PO~Oh6SO!Y'VO%b6PO~O#e%YiP%YiY%Yi_%Yil%Yi{%Yi!f%Yi!g%Yi!i%Yi!m%Yi#h%Yi#i%Yi#j%Yi#k%Yi#l%Yi#m%Yi#n%Yi#o%Yi#p%Yi#r%Yi#t%Yi#v%Yi#w%Yi'm%Yi(T%Yi(d%Yi!h%Yi!T%Yi'k%Yip%Yi!Y%Yi%b%Yi!b%Yi~P$I|O#e%[iP%[iY%[i_%[il%[i{%[i!f%[i!g%[i!i%[i!m%[i#h%[i#i%[i#j%[i#k%[i#l%[i#m%[i#n%[i#o%[i#p%[i#r%[i#t%[i#v%[i#w%[i'm%[i(T%[i(d%[i!h%[i!T%[i'k%[ip%[i!Y%[i%b%[i!b%[i~P$JoO#e$viP$viY$vi_$vil$vi{$vi!W$vi!f$vi!g$vi!i$vi!m$vi#h$vi#i$vi#j$vi#k$vi#l$vi#m$vi#n$vi#o$vi#p$vi#r$vi#t$vi#v$vi#w$vi'm$vi(T$vi(d$vi!h$vi!T$vi'k$vi#Y$vip$vi!Y$vi%b$vi!b$vi~P#,gOe'Qa!W'Qa~P!0kO!W'Ra!h'Ra~P!7zO!W.bO!h(_i~O#z#]i!W#]i!X#]i~P#CQOP$]Oz#yO{#zO}#{O!g#wO!i#xO!m$]O(TVOY#gil#gi!f#gi#i#gi#j#gi#k#gi#l#gi#m#gi#n#gi#o#gi#p#gi#r#gi#t#gi#v#gi#w#gi#z#gi(d#gi(k#gi(l#gi!W#gi!X#gi~O#h#gi~P%2}O#h9zO~P%2}OP$]Oz#yO{#zO}#{O!g#wO!i#xO!m$]O#h9zO#i9{O#j9{O#k9{O(TVOY#gi!f#gi#l#gi#m#gi#n#gi#o#gi#p#gi#r#gi#t#gi#v#gi#w#gi#z#gi(d#gi(k#gi(l#gi!W#gi!X#gi~Ol#gi~P%5YOl9|O~P%5YOP$]Ol9|Oz#yO{#zO}#{O!g#wO!i#xO!m$]O#h9zO#i9{O#j9{O#k9{O#l9}O(TVO#r#gi#t#gi#v#gi#w#gi#z#gi(d#gi(k#gi(l#gi!W#gi!X#gi~OY#gi!f#gi#m#gi#n#gi#o#gi#p#gi~P%7eOY:YO!f:OO#m:OO#n:OO#o:XO#p:OO~P%7eOP$]OY:YOl9|Oz#yO{#zO}#{O!f:OO!g#wO!i#xO!m$]O#h9zO#i9{O#j9{O#k9{O#l9}O#m:OO#n:OO#o:XO#p:OO#r:PO(TVO#t#gi#v#gi#w#gi#z#gi(d#gi(l#gi!W#gi!X#gi~O(k#gi~P%:PO(k#|O~P%:POP$]OY:YOl9|Oz#yO{#zO}#{O!f:OO!g#wO!i#xO!m$]O#h9zO#i9{O#j9{O#k9{O#l9}O#m:OO#n:OO#o:XO#p:OO#r:PO#t:RO(TVO(k#|O#v#gi#w#gi#z#gi(d#gi!W#gi!X#gi~O(l#gi~P%<[O(l#}O~P%<[OP$]OY:YOl9|Oz#yO{#zO}#{O!f:OO!g#wO!i#xO!m$]O#h9zO#i9{O#j9{O#k9{O#l9}O#m:OO#n:OO#o:XO#p:OO#r:PO#t:RO#v:TO(TVO(k#|O(l#}O~O#w#gi#z#gi(d#gi!W#gi!X#gi~P%>gO_#xy!W#xy'm#xy'k#xy!T#xy!h#xyp#xy!Y#xy%b#xy!b#xy~P!7zOh;mOz)vO})wO(k)yO(l){O~OP#giY#gil#gi{#gi!f#gi!g#gi!i#gi!m#gi#h#gi#i#gi#j#gi#k#gi#l#gi#m#gi#n#gi#o#gi#p#gi#r#gi#t#gi#v#gi#w#gi#z#gi(T#gi(d#gi!W#gi!X#gi~P%A_O!g#wOP(SXY(SXh(SXl(SXz(SX{(SX}(SX!f(SX!i(SX!m(SX#h(SX#i(SX#j(SX#k(SX#l(SX#m(SX#n(SX#o(SX#p(SX#r(SX#t(SX#v(SX#w(SX#z(SX(T(SX(d(SX(k(SX(l(SX!W(SX!X(SX~O#z#{i!W#{i!X#{i~P#CQO#z!oi!X!oi~P$$nO!X6`O~O!W'[a!X'[a~P#CQO!b#uO(d'gO!W']a!h']a~O!W/VO!h(qi~O!W/VO!b#uO!h(qi~Oe$vq!W$vq#Y$vq#z$vq~P!0kO!T'_a!W'_a~P#,gO!b6gO~O!W/_O!T(ri~P#,gO!W/_O!T(ri~O!T6kO~O!b#uO#p6pO~Ol6qO!b#uO(d'gO~O!T6sO~Oe$xq!W$xq#Y$xq#z$xq~P!0kO_$jy!W$jy'm$jy'k$jy!T$jy!h$jyp$jy!Y$jy%b$jy!b$jy~P!7zO!b5kO~O!W4WO!Y(sa~O_#]y!W#]y'm#]y'k#]y!T#]y!h#]yp#]y!Y#]y%b#]y!b#]y~P!7zOY6xO~O!W0bO!X(zi~O^7OO~O(W(tO!W'dX!X'dX~O!W4nO!X(wa~OjkO'v7VO~P.iO!X7YO~P%$nOm!nO}7ZO'xTO'{UO(W!mO(c!sO~O!Y0zO~O!Y0zO%b7]O~Oh7`O!Y0zO%b7]O~OY7eO!W'ga!X'ga~O!W1VO!X(xi~O!h7iO~O!h7jO~O!h7mO~O!h7mO~P%[O_7oO~O!b7pO~O!h7qO~O!W(ii!X(ii~P#CQO_%gO#Y7yO'm%gO~O!W(fy!h(fy_(fy'm(fy~P!7zO!W(`O!h(ey~O!Y'VO%b7|O~O#e$vqP$vqY$vq_$vql$vq{$vq!W$vq!f$vq!g$vq!i$vq!m$vq#h$vq#i$vq#j$vq#k$vq#l$vq#m$vq#n$vq#o$vq#p$vq#r$vq#t$vq#v$vq#w$vq'm$vq(T$vq(d$vq!h$vq!T$vq'k$vq#Y$vqp$vq!Y$vq%b$vq!b$vq~P#,gO#e$xqP$xqY$xq_$xql$xq{$xq!W$xq!f$xq!g$xq!i$xq!m$xq#h$xq#i$xq#j$xq#k$xq#l$xq#m$xq#n$xq#o$xq#p$xq#r$xq#t$xq#v$xq#w$xq'm$xq(T$xq(d$xq!h$xq!T$xq'k$xq#Y$xqp$xq!Y$xq%b$xq!b$xq~P#,gO!W'Ri!h'Ri~P!7zO#z#]q!W#]q!X#]q~P#CQOz/yO{/yO}/zOPwaYwahwalwa!fwa!gwa!iwa!mwa#hwa#iwa#jwa#kwa#lwa#mwa#nwa#owa#pwa#rwa#twa#vwa#wwa#zwa(Twa(dwa(kwa(lwa!Wwa!Xwa~Oz)vO})wOP$maY$mah$mal$ma{$ma!f$ma!g$ma!i$ma!m$ma#h$ma#i$ma#j$ma#k$ma#l$ma#m$ma#n$ma#o$ma#p$ma#r$ma#t$ma#v$ma#w$ma#z$ma(T$ma(d$ma(k$ma(l$ma!W$ma!X$ma~Oz)vO})wOP$oaY$oah$oal$oa{$oa!f$oa!g$oa!i$oa!m$oa#h$oa#i$oa#j$oa#k$oa#l$oa#m$oa#n$oa#o$oa#p$oa#r$oa#t$oa#v$oa#w$oa#z$oa(T$oa(d$oa(k$oa(l$oa!W$oa!X$oa~OP$}aY$}al$}a{$}a!f$}a!g$}a!i$}a!m$}a#h$}a#i$}a#j$}a#k$}a#l$}a#m$}a#n$}a#o$}a#p$}a#r$}a#t$}a#v$}a#w$}a#z$}a(T$}a(d$}a!W$}a!X$}a~P%A_O#z$iq!W$iq!X$iq~P#CQO#z$jq!W$jq!X$jq~P#CQO!X8WO~O#z8XO~P!0kO!b#uO!W']i!h']i~O!b#uO(d'gO!W']i!h']i~O!W/VO!h(qq~O!T'_i!W'_i~P#,gO!W/_O!T(rq~O!T8_O~P#,gO!T8_O~Oe(Ry!W(Ry~P!0kO!W'ba!Y'ba~P#,gO_%Uq!Y%Uq'm%Uq!W%Uq~P#,gOY8dO~O!W0bO!X(zq~O#Y8hO!W'da!X'da~O!W4nO!X(wi~P#CQOPZXYZXlZXzZX{ZX}ZX!TZX!WZX!fZX!gZX!iZX!mZX#YZX#edX#hZX#iZX#jZX#kZX#lZX#mZX#nZX#oZX#pZX#rZX#tZX#vZX#wZX#|ZX(TZX(dZX(kZX(lZX~O!b%SX#p%SX~P&2_O!Y0zO%b8lO~O'xTO'{UO(W8qO~O!W1VO!X(xq~O!h8tO~O!h8uO~O!h8vO~O!h8vO~P%[O#Y8yO!W#by!X#by~O!W#by!X#by~P#CQO!Y'VO%b9OO~O#z#xy!W#xy!X#xy~P#CQOP$viY$vil$vi{$vi!f$vi!g$vi!i$vi!m$vi#h$vi#i$vi#j$vi#k$vi#l$vi#m$vi#n$vi#o$vi#p$vi#r$vi#t$vi#v$vi#w$vi#z$vi(T$vi(d$vi!W$vi!X$vi~P%A_Oz)vO})wO(l){OP%YiY%Yih%Yil%Yi{%Yi!f%Yi!g%Yi!i%Yi!m%Yi#h%Yi#i%Yi#j%Yi#k%Yi#l%Yi#m%Yi#n%Yi#o%Yi#p%Yi#r%Yi#t%Yi#v%Yi#w%Yi#z%Yi(T%Yi(d%Yi(k%Yi!W%Yi!X%Yi~Oz)vO})wOP%[iY%[ih%[il%[i{%[i!f%[i!g%[i!i%[i!m%[i#h%[i#i%[i#j%[i#k%[i#l%[i#m%[i#n%[i#o%[i#p%[i#r%[i#t%[i#v%[i#w%[i#z%[i(T%[i(d%[i(k%[i(l%[i!W%[i!X%[i~O#z$jy!W$jy!X$jy~P#CQO#z#]y!W#]y!X#]y~P#CQO!b#uO!W']q!h']q~O!W/VO!h(qy~O!T'_q!W'_q~P#,gO!T9VO~P#,gO!W0bO!X(zy~O!W4nO!X(wq~O!Y0zO%b9^O~O!h9aO~O!Y'VO%b9fO~OP$vqY$vql$vq{$vq!f$vq!g$vq!i$vq!m$vq#h$vq#i$vq#j$vq#k$vq#l$vq#m$vq#n$vq#o$vq#p$vq#r$vq#t$vq#v$vq#w$vq#z$vq(T$vq(d$vq!W$vq!X$vq~P%A_OP$xqY$xql$xq{$xq!f$xq!g$xq!i$xq!m$xq#h$xq#i$xq#j$xq#k$xq#l$xq#m$xq#n$xq#o$xq#p$xq#r$xq#t$xq#v$xq#w$xq#z$xq(T$xq(d$xq!W$xq!X$xq~P%A_Oe%^!Z!W%^!Z#Y%^!Z#z%^!Z~P!0kO!W'dq!X'dq~P#CQO!W#b!Z!X#b!Z~P#CQO#e%^!ZP%^!ZY%^!Z_%^!Zl%^!Z{%^!Z!W%^!Z!f%^!Z!g%^!Z!i%^!Z!m%^!Z#h%^!Z#i%^!Z#j%^!Z#k%^!Z#l%^!Z#m%^!Z#n%^!Z#o%^!Z#p%^!Z#r%^!Z#t%^!Z#v%^!Z#w%^!Z'm%^!Z(T%^!Z(d%^!Z!h%^!Z!T%^!Z'k%^!Z#Y%^!Zp%^!Z!Y%^!Z%b%^!Z!b%^!Z~P#,gOP%^!ZY%^!Zl%^!Z{%^!Z!f%^!Z!g%^!Z!i%^!Z!m%^!Z#h%^!Z#i%^!Z#j%^!Z#k%^!Z#l%^!Z#m%^!Z#n%^!Z#o%^!Z#p%^!Z#r%^!Z#t%^!Z#v%^!Z#w%^!Z#z%^!Z(T%^!Z(d%^!Z!W%^!Z!X%^!Z~P%A_Op(XX~P1qO'w!lO~P!*SO!TdX!WdX#YdX~P&2_OPZXYZXlZXzZX{ZX}ZX!WZX!WdX!fZX!gZX!iZX!mZX#YZX#YdX#edX#hZX#iZX#jZX#kZX#lZX#mZX#nZX#oZX#pZX#rZX#tZX#vZX#wZX#|ZX(TZX(dZX(kZX(lZX~O!bdX!hZX!hdX(ddX~P&GuOP9qOQ9qOb;bOc!iOjkOl9qOmkOnkOtkOv9qOx9qO}WO!RkO!SkO!YXO!d9tO!iZO!l9qO!m9qO!n9qO!p9uO!r9xO!u!hO$R!kO$VfO'v)UO'xTO'{UO(TVO(c[O(p;`O~O!W:VO!X$la~Oj%SOl$tOm$sOn$sOt%TOv%UOx:]O}${O!Y$|O!d;gO!i$xO#d:cO$R%YO$n:_O$p:aO$s%ZO'v(lO'xTO'{UO(P%RO(T$uO~O#q)]O~P&LkO!XZX!XdX~P&GuO#e9yO~O!b#uO#e9yO~O#Y:ZO~O#p:OO~O#Y:eO!W(iX!X(iX~O#Y:ZO!W(gX!X(gX~O#e:fO~Oe:hO~P!0kO#e:mO~O#e:nO~O!b#uO#e:oO~O!b#uO#e:fO~O#z:pO~P#CQO#e:qO~O#e:rO~O#e:sO~O#e:tO~O#e:uO~O#e:vO~O#z:wO~P!0kO#z:xO~P!0kO$V~!g!}#O#Q#R#U#c#d#o(p$n$p$s%V%a%b%c%j%l%o%p%r%t~'qR$V(p#i!S'o'w#jm#h#klz'p(W'p'v$X$Z$X~",
  goto: "$'R)OPPPP)PPP)SP)eP*t.xPPPP5YPP5pP;l>sP?WP?WPPP?WP@xP?WP?WP?WP@|PPARPAlPFdPPPFhPPPPFhIiPPPIoJjPFhPLxPPPP! WFhPPPFhPFhP!#fFhP!&z!'|!(VP!(y!(}!(yPPPPP!,Y!'|PP!,v!-pP!0dFhFh!0i!3s!8Y!8Y!<OPPP!<VFhPPPPPPPPPPP!?dP!@uPPFh!BSPFhPFhFhFhFhPFh!CfPP!FnP!IrP!Iv!JQ!JU!JUP!FkP!JY!JYP!M^P!MbFhFh!Mh#!k?WP?WP?W?WP##v?W?W#%r?W#(R?W#)w?W?W#*f#,d#,d#,h#,p#,d#,xP#,dP?W#-b?W#.k?W?W5YPPP#/wPPP#0b#0bP#0bP#0x#0bPP#1OP#0uP#0u#1c#0u#1}#2T5V)S#2W)SP#2_#2_#2_P)SP)SP)SP)SPP)SP#2e#2hP#2h)SP#2lP#2oP)SP)SP)SP)SP)SP)S)SPP#2u#2{#3W#3^#3d#3j#3p#4O#4U#4[#4f#4l#4v#5V#5]#5}#6a#6g#6m#6{#7b#8s#9R#9X#9_#9e#9k#9u#9{#:R#:]#:o#:uPPPPPPPPPP#:{PPPPPPP#;p#>wP#@W#@_#@gPPPP#Du#Gl#NT#NW#NZ$ S$ V$ Y$ a$ iPP$ o$ s$!k$#j$#n$$SPP$$W$$^$$bP$$e$$i$$l$%b$%y$&b$&f$&i$&l$&r$&u$&y$&}R!{RoqOXst!Z#c%f&i&k&l&n,b,g1g1jY!uQ'V-S0z4uQ%lvQ%tyQ%{|Q&a!VS&}!e,zQ']!iS'c!r!xS*_$|*dQ+`%uQ+m%}Q,R&ZQ-Q'UQ-['^Q-d'dQ/p*fQ1U,SR:d9u%OdOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$a$e%f%l%y&b&e&i&k&l&n&r&z'X'i'y'{(R(Y(n(r(v)u*x*|,_,b,g-W-`-n-t.b.i/z0P0a0}1_1`1b1d1g1j1l2]2c2w4r4|5^5_5b5u7Z7`7o7yS#p]9r!r)W$[$m'O)j,s,v.q1{3^4p5l8h8y9q9t9u9x9y9z9{9|9}:O:P:Q:R:S:T:U:V:Z:d:e:f:h:o:p:u:v;cQ*o%VQ+e%wQ,T&^Q,[&fQ.X:[Q0W+WQ0[+YQ0g+fQ1^,YQ2k.UQ4`0bQ5T1VQ6R2oQ6X:]Q6z4aR8P6S&|kOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$[$a$e$m%f%l%y&b&e&f&i&k&l&n&r&z'O'X'i'y'{(R(Y(n(r(v)j)u*x*|+W,_,b,g,s,v-W-`-n-t.U.b.i.q/z0P0a0}1_1`1b1d1g1j1l1{2]2c2o2w3^4p4r4|5^5_5b5l5u6S7Z7`7o7y8h8y9q9t9u9x9y9z9{9|9}:O:P:Q:R:S:T:U:V:Z:d:e:f:h:o:p:u:v;ct!nQ!r!u!x!y&}'U'V'c'd'e,z-Q-S-d0z4u4w$^$si#u#w$c$d$x${%W%X%])q)w)z)|)}*U*[*j*k+V+Y+q+t.T._/P/^/_/a/|0q0t0|2n3f3p3x4O4W4Y4{6P6g6p7]7|8X8l9O9^9f:X:Y:^:_:`:a:b:c:i:j:k:l:m:n:q:r:s:t:w:x;`;h;i;l;mQ&O|Q&{!eS'R%b,}Q+e%wQ/{*sQ0g+fQ0l+lQ1],XQ1^,YQ4`0bQ4i0nQ5W1XQ5X1[Q6z4aQ6}4fQ7h5ZQ8g7OR8r7ernOXst!V!Z#c%f&`&i&k&l&n,b,g1g1jR,V&b&v^OPXYstuvwz!Z!`!g!j!o#R#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$[$a$e$m%f%l%y&b&e&f&i&k&l&n&r&z'X'i'{(R(Y(n(r(v)j)u*x*|+W,_,b,g,s,v-W-`-n-t.U.b.i.q/z0P0a0}1_1`1b1d1g1j1l1{2]2c2o2w3^4p4r4|5^5_5b5l5u6S7Z7`7o7y8h8y9q9t9u9x9y9z9{9|9}:O:P:Q:R:S:T:U:V:Z:d:e:f:h:o:p:u:v;b;c[#[WZ#V#Y'O'y!S%cm#g#h#k%^%a(S(^(_(`*z*{*},^,t-r-x-y-z-|1o2g2h5k5|Q%oxQ%syS%x|%}Q&U!TQ'Y!hQ'[!iQ(g#rS*R$x*VS+_%t%uQ+c%wQ+|&XQ,Q&ZS-Z']'^Q.W(hQ/Z*SQ0`+`Q0f+fQ0h+gQ0k+kQ1P+}S1T,R,SQ2X-[Q3g/VQ4_0bQ4c0eQ4h0mQ5S1UQ6d3hQ6y4aQ6|4eQ8c6xR9X8dv$zi#w%W%X%])z)|*U*j*k._/^/|3f4O8X;`;h;i!S%qy!i!t%s%t%u&|'[']'^'b'l*^+_+`,w-Z-[-c/h0`2Q2X2`3zQ+X%oQ+r&RQ+u&SQ,P&ZQ.V(gQ1O+|U1S,Q,R,SQ2p.WQ4}1PS5R1T1UQ7d5S#O;d#u$c$d$x${)q)w)}*[+V+Y+q+t.T/P/_/a0q0t0|2n3p3x4W4Y4{6P6g6p7]7|8l9O9^9f:^:`:b:i:k:m:q:s:w;l;mg;e:X:Y:_:a:c:j:l:n:r:t:xW%Pi%R*l;`S&R!Q&`Q&S!RQ&T!SR+p&P$_%Oi#u#w$c$d$x${%W%X%])q)w)z)|)}*U*[*j*k+V+Y+q+t.T._/P/^/_/a/|0q0t0|2n3f3p3x4O4W4Y4{6P6g6p7]7|8X8l9O9^9f:X:Y:^:_:`:a:b:c:i:j:k:l:m:n:q:r:s:t:w:x;`;h;i;l;mT)r$u)sV*p%V:[:]U'R!e%b,}S(u#y#zQ+j%zS.P(c(dQ0u+vQ4P/yR7S4n&|kOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$[$a$e$m%f%l%y&b&e&f&i&k&l&n&r&z'O'X'i'y'{(R(Y(n(r(v)j)u*x*|+W,_,b,g,s,v-W-`-n-t.U.b.i.q/z0P0a0}1_1`1b1d1g1j1l1{2]2c2o2w3^4p4r4|5^5_5b5l5u6S7Z7`7o7y8h8y9q9t9u9x9y9z9{9|9}:O:P:Q:R:S:T:U:V:Z:d:e:f:h:o:p:u:v;c$i$`c#X#d%j%k%m'x(O(j(q(y(z({(|(})O)P)Q)R)S)T)V)Y)^)h+T+i,x-g-l-q-s.^.d.h.j.k.l.{/}1v1y2Z2b2v2{2|2}3O3P3Q3R3S3T3U3V3W3X3[3]3b4T4]5n5t5y6V6W6]6^7U7s7w8Q8U8V8{9Z9b9s;VT#SV#T&}kOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$[$a$e$m%f%l%y&b&e&f&i&k&l&n&r&z'O'X'i'y'{(R(Y(n(r(v)j)u*x*|+W,_,b,g,s,v-W-`-n-t.U.b.i.q/z0P0a0}1_1`1b1d1g1j1l1{2]2c2o2w3^4p4r4|5^5_5b5l5u6S7Z7`7o7y8h8y9q9t9u9x9y9z9{9|9}:O:P:Q:R:S:T:U:V:Z:d:e:f:h:o:p:u:v;cQ'P!eR1|,zv!nQ!e!r!u!x!y&}'U'V'c'd'e,z-Q-S-d0z4u4wS*^$|*dS/h*_*fQ/q*gQ0w+xQ3z/pR3}/snqOXst!Z#c%f&i&k&l&n,b,g1g1jQ&p!^Q'm!wS(i#t9yQ+]%rQ+z&UQ+{&WQ-X'ZQ-f'fS.](n:fS0O*x:oQ0^+^Q0y+yQ1n,iQ1p,jQ1x,uQ2V-YQ2Y-^S4U0P:uQ4Z0_S4^0a:vQ5m1zQ5q2WQ5v2_Q6w4[Q7t5oQ7u5rQ7x5wR8x7q$d$_c#X#d%k%m'x(O(j(q(y(z({(|(})O)P)Q)R)S)T)V)Y)^)h+T+i,x-g-l-q-s.^.d.h.k.l.{/}1v1y2Z2b2v2{2|2}3O3P3Q3R3S3T3U3V3W3X3[3]3b4T4]5n5t5y6V6W6]6^7U7s7w8Q8U8V8{9Z9b9s;VS(f#o'`U*i$}(m3ZS+S%j.jQ2l0WQ6O2kQ8O6RR9P8P$d$^c#X#d%k%m'x(O(j(q(y(z({(|(})O)P)Q)R)S)T)V)Y)^)h+T+i,x-g-l-q-s.^.d.h.k.l.{/}1v1y2Z2b2v2{2|2}3O3P3Q3R3S3T3U3V3W3X3[3]3b4T4]5n5t5y6V6W6]6^7U7s7w8Q8U8V8{9Z9b9s;VS(e#o'`S(w#z$_S+R%j.jS.Q(d(fQ.m)XQ0T+SR2i.R&|kOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$[$a$e$m%f%l%y&b&e&f&i&k&l&n&r&z'O'X'i'y'{(R(Y(n(r(v)j)u*x*|+W,_,b,g,s,v-W-`-n-t.U.b.i.q/z0P0a0}1_1`1b1d1g1j1l1{2]2c2o2w3^4p4r4|5^5_5b5l5u6S7Z7`7o7y8h8y9q9t9u9x9y9z9{9|9}:O:P:Q:R:S:T:U:V:Z:d:e:f:h:o:p:u:v;cS#p]9rQ&k!XQ&l!YQ&n![Q&o!]R1f,eQ'W!hQ+U%oQ-V'YS.S(g+XQ2T-UW2m.V.W0V0XQ5p2UU5}2j2l2pS7{6O6QS8}7}8OS9d8|9PQ9l9eR9o9mU!vQ'V-ST4s0z4u!Q_OXZ`st!V!Z#c#g%^%f&`&b&i&k&l&n(`,b,g-y1g1j]!pQ!r'V-S0z4uT#p]9r%Y{OPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$a$e%f%l%y&b&e&f&i&k&l&n&r&z'X'i'y'{(R(Y(n(r(v)u*x*|+W,_,b,g-W-`-n-t.U.b.i/z0P0a0}1_1`1b1d1g1j1l2]2c2o2w4r4|5^5_5b5u6S7Z7`7o7yS(u#y#zS.P(c(d!s:|$[$m'O)j,s,v.q1{3^4p5l8h8y9q9t9u9x9y9z9{9|9}:O:P:Q:R:S:T:U:V:Z:d:e:f:h:o:p:u:v;cY!tQ'V-S0z4uQ'b!rS'l!u!xS'n!y4wS-c'c'dQ-e'eR2`-dQ'k!tS([#f1aS-b'b'nQ/Y*RQ/f*^Q2a-eQ3l/ZS3u/g/qQ6c3gS6n3{3}Q8Z6dR8b6qQ#vbQ'j!tS(Z#f1aS(]#l*wQ*y%_Q+Z%pQ+a%vU-a'b'k'nQ-u([Q/X*RQ/e*^Q/k*aQ0]+[Q1Q,OS2^-b-eQ2f-}S3k/Y/ZS3t/f/qQ3w/jQ3y/lQ5P1RQ5x2aQ6b3gQ6f3lS6j3u3}Q6o3|Q7b5QS8Y6c6dQ8^6kQ8`6nQ8o7cQ9T8ZQ9U8_Q9W8bQ9`8pQ9h9VQ;P:zQ;[;TR;];UV!vQ'V-S%YaOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$a$e%f%l%y&b&e&f&i&k&l&n&r&z'X'i'y'{(R(Y(n(r(v)u*x*|+W,_,b,g-W-`-n-t.U.b.i/z0P0a0}1_1`1b1d1g1j1l2]2c2o2w4r4|5^5_5b5u6S7Z7`7o7yS#vz!j!r:y$[$m'O)j,s,v.q1{3^4p5l8h8y9q9t9u9x9y9z9{9|9}:O:P:Q:R:S:T:U:V:Z:d:e:f:h:o:p:u:v;cR;P;b%YbOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$a$e%f%l%y&b&e&f&i&k&l&n&r&z'X'i'y'{(R(Y(n(r(v)u*x*|+W,_,b,g-W-`-n-t.U.b.i/z0P0a0}1_1`1b1d1g1j1l2]2c2o2w4r4|5^5_5b5u6S7Z7`7o7yQ%_j!S%py!i!t%s%t%u&|'[']'^'b'l*^+_+`,w-Z-[-c/h0`2Q2X2`3zS%vz!jQ+[%qQ,O&ZW1R,P,Q,R,SU5Q1S1T1US7c5R5SQ8p7d!r:z$[$m'O)j,s,v.q1{3^4p5l8h8y9q9t9u9x9y9z9{9|9}:O:P:Q:R:S:T:U:V:Z:d:e:f:h:o:p:u:v;cQ;T;aR;U;b$|eOPXYstuvw!Z!`!g!o#R#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$a$e%f%l%y&b&e&i&k&l&n&r&z'X'i'{(R(Y(n(r(v)u*x*|+W,_,b,g-W-`-n-t.U.b.i/z0P0a0}1_1`1b1d1g1j1l2]2c2o2w4r4|5^5_5b5u6S7Z7`7o7yY#aWZ#V#Y'y!S%cm#g#h#k%^%a(S(^(_(`*z*{*},^,t-r-x-y-z-|1o2g2h5k5|Q,]&f!p:{$[$m)j,s,v.q1{3^4p5l8h8y9q9t9u9x9y9z9{9|9}:O:P:Q:R:S:T:U:V:Z:d:e:f:h:o:p:u:v;cR;O'OS'S!e%bR2O,}%OdOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$a$e%f%l%y&b&e&i&k&l&n&r&z'X'i'y'{(R(Y(n(r(v)u*x*|,_,b,g-W-`-n-t.b.i/z0P0a0}1_1`1b1d1g1j1l2]2c2w4r4|5^5_5b5u7Z7`7o7y!r)W$[$m'O)j,s,v.q1{3^4p5l8h8y9q9t9u9x9y9z9{9|9}:O:P:Q:R:S:T:U:V:Z:d:e:f:h:o:p:u:v;cQ,[&fQ0W+WQ2k.UQ6R2oR8P6S!f$Uc#X%j'x(O(j(q)Q)R)S)T)Y)^+i-g-l-q-s.^.d.{/}2Z2b2v3X4T4]5t5y6V7w8{9s!T:Q)V)h,x.j1v1y2{3T3U3V3W3[3b5n6W6]6^7U7s8Q8U8V9Z9b;V!b$Wc#X%j'x(O(j(q)S)T)Y)^+i-g-l-q-s.^.d.{/}2Z2b2v3X4T4]5t5y6V7w8{9s!P:S)V)h,x.j1v1y2{3V3W3[3b5n6W6]6^7U7s8Q8U8V9Z9b;V!^$[c#X%j'x(O(j(q)Y)^+i-g-l-q-s.^.d.{/}2Z2b2v3X4T4]5t5y6V7w8{9sQ3f/Tz;c)V)h,x.j1v1y2{3[3b5n6W6]6^7U7s8Q8U8V9Z9b;VQ;h;jR;i;k&|kOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$[$a$e$m%f%l%y&b&e&f&i&k&l&n&r&z'O'X'i'y'{(R(Y(n(r(v)j)u*x*|+W,_,b,g,s,v-W-`-n-t.U.b.i.q/z0P0a0}1_1`1b1d1g1j1l1{2]2c2o2w3^4p4r4|5^5_5b5l5u6S7Z7`7o7y8h8y9q9t9u9x9y9z9{9|9}:O:P:Q:R:S:T:U:V:Z:d:e:f:h:o:p:u:v;cS$nh$oR3_.p'TgOPWXYZhstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$[$a$e$m$o%f%l%y&b&e&f&i&k&l&n&r&z'O'X'i'y'{(R(Y(n(r(v)j)u*x*|+W,_,b,g,s,v-W-`-n-t.U.b.i.p.q/z0P0a0}1_1`1b1d1g1j1l1{2]2c2o2w3^4p4r4|5^5_5b5l5u6S7Z7`7o7y8h8y9q9t9u9x9y9z9{9|9}:O:P:Q:R:S:T:U:V:Z:d:e:f:h:o:p:u:v;cT$jf$pQ$hfS)a$k)eR)m$pT$if$pT)c$k)e'ThOPWXYZhstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$[$a$e$m$o%f%l%y&b&e&f&i&k&l&n&r&z'O'X'i'y'{(R(Y(n(r(v)j)u*x*|+W,_,b,g,s,v-W-`-n-t.U.b.i.p.q/z0P0a0}1_1`1b1d1g1j1l1{2]2c2o2w3^4p4r4|5^5_5b5l5u6S7Z7`7o7y8h8y9q9t9u9x9y9z9{9|9}:O:P:Q:R:S:T:U:V:Z:d:e:f:h:o:p:u:v;cT$nh$oQ$qhR)l$o%YjOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$a$e%f%l%y&b&e&f&i&k&l&n&r&z'X'i'y'{(R(Y(n(r(v)u*x*|+W,_,b,g-W-`-n-t.U.b.i/z0P0a0}1_1`1b1d1g1j1l2]2c2o2w4r4|5^5_5b5u6S7Z7`7o7y!s;a$[$m'O)j,s,v.q1{3^4p5l8h8y9q9t9u9x9y9z9{9|9}:O:P:Q:R:S:T:U:V:Z:d:e:f:h:o:p:u:v;c#clOPXZst!Z!`!o#R#c#n#{$m%f&b&e&f&i&k&l&n&r&z'X(v)j*|+W,_,b,g-W.U.q/z0}1_1`1b1d1g1j1l2o3^4r4|5^5_5b6S7Z7`7ov$}i#w%W%X%])z)|*U*j*k._/^/|3f4O8X;`;h;i#O(m#u$c$d$x${)q)w)}*[+V+Y+q+t.T/P/_/a0q0t0|2n3p3x4W4Y4{6P6g6p7]7|8l9O9^9f:^:`:b:i:k:m:q:s:w;l;mQ*t%ZQ.|)vg3Z:X:Y:_:a:c:j:l:n:r:t:xv$yi#w%W%X%])z)|*U*j*k._/^/|3f4O8X;`;h;iQ*W$zS*a$|*dQ*u%[Q/l*b#O;R#u$c$d$x${)q)w)}*[+V+Y+q+t.T/P/_/a0q0t0|2n3p3x4W4Y4{6P6g6p7]7|8l9O9^9f:^:`:b:i:k:m:q:s:w;l;mf;S:X:Y:_:a:c:j:l:n:r:t:xQ;W;dQ;X;eQ;Y;fR;Z;gv$}i#w%W%X%])z)|*U*j*k._/^/|3f4O8X;`;h;i#O(m#u$c$d$x${)q)w)}*[+V+Y+q+t.T/P/_/a0q0t0|2n3p3x4W4Y4{6P6g6p7]7|8l9O9^9f:^:`:b:i:k:m:q:s:w;l;mg3Z:X:Y:_:a:c:j:l:n:r:t:xnoOXst!Z#c%f&i&k&l&n,b,g1g1jQ*Z${Q,p&uQ,q&wR3o/_$^%Oi#u#w$c$d$x${%W%X%])q)w)z)|)}*U*[*j*k+V+Y+q+t.T._/P/^/_/a/|0q0t0|2n3f3p3x4O4W4Y4{6P6g6p7]7|8X8l9O9^9f:X:Y:^:_:`:a:b:c:i:j:k:l:m:n:q:r:s:t:w:x;`;h;i;l;mQ+s&SQ0s+uQ4l0rR7R4mT*c$|*dS*c$|*dT4t0z4uS/j*`4rT3|/r7ZQ+Z%pQ/k*aQ0]+[Q1Q,OQ5P1RQ7b5QQ8o7cR9`8pn)z$v(o*v/]/t/u2t3m4S6a6r9S;Q;^;_!Y:i(k)[*Q*Y.[.x.}/T/b0U0p0r2s3n3r4k4m6T6U6h6l6t6v8]8a9g;j;k]:j3Y6[8R9Q9R9pp)|$v(o*v/R/]/t/u2t3m4S6a6r9S;Q;^;_![:k(k)[*Q*Y.[.x.}/T/b0U0p0r2q2s3n3r4k4m6T6U6h6l6t6v8]8a9g;j;k_:l3Y6[8R8S9Q9R9prnOXst!V!Z#c%f&`&i&k&l&n,b,g1g1jQ&]!UR,_&frnOXst!V!Z#c%f&`&i&k&l&n,b,g1g1jR&]!UQ+w&TR0o+psnOXst!V!Z#c%f&`&i&k&l&n,b,g1g1jQ0{+|S4z1O1PU7[4x4y4}S8k7^7_S9[8j8mQ9i9]R9n9jQ&d!VR,W&`R5W1XS%x|%}R0h+gQ&i!WR,b&jR,h&oT1h,g1jR,l&pQ,k&pR1q,lQ'p!zR-h'pSsOtQ#cXT%is#cQ!}TR'r!}Q#QUR't#QQ)s$uR.y)sQ#TVR'v#TQ#WWU'|#W'}-oQ'}#XR-o(OQ,{'PR1},{Q.`(oR2u.`Q.c(qS2x.c2yR2y.dQ-S'VR2R-SY!rQ'V-S0z4uR'a!rS#^W%aU(T#^(U-pQ(U#_R-p(PQ-O'SR2P-Ot`OXst!V!Z#c%f&`&b&i&k&l&n,b,g1g1jS#gZ%^U#q`#g-yR-y(`Q(a#iQ-v(]W.O(a-v2d5zQ2d-wR5z2eQ)e$kR.r)eQ$ohR)k$oQ$bcU)Z$b-k:WQ-k9sR:W)hQ/W*RW3i/W3j6e8[U3j/X/Y/ZS6e3k3lR8[6f#o)x$v(k(o)[*Q*Y*q*r*v.Y.Z.[.x.}/R/S/T/]/b/t/u0U0p0r2q2r2s2t3Y3m3n3r4S4k4m6T6U6Y6Z6[6a6h6l6r6t6v8R8S8T8]8a9Q9R9S9g9p;Q;^;_;j;kQ/`*YU3q/`3s6iQ3s/bR6i3rQ*d$|R/n*dQ*m%QR/w*mQ4X0UR6u4XQ+O%dR0S+OQ4o0uS7T4o8iR8i7UQ+y&UR0x+yQ4u0zR7X4uQ1W,TS5U1W7fR7f5WQ0c+cW4b0c4d6{8eQ4d0fQ6{4cR8e6|Q+h%xR0i+hQ1j,gR5f1jYrOXst#cQ&m!ZQ+Q%fQ,a&iQ,c&kQ,d&lQ,f&nQ1e,bS1h,g1jR5e1gQ%hpQ&q!_Q&t!aQ&v!bQ&x!cQ'h!tQ+P%eQ+]%rQ+o&OQ,V&dQ,n&sW-_'b'j'k'nQ-f'fQ/m*cQ0^+^S1Z,W,ZQ1r,mQ1s,pQ1t,qQ2Y-^W2[-a-b-e-gQ4Z0_Q4g0lQ4j0pQ5O1QQ5Y1]Q5d1fU5s2Z2^2aQ5v2_Q6w4[Q7P4iQ7Q4kQ7W4tQ7a5PQ7g5XS7v5t5xQ7x5wQ8f6}Q8n7bQ8s7hQ8z7wQ9Y8gQ9_8oQ9c8{R9k9`Q%ryQ'Z!iQ'f!tU+^%s%t%uQ,u&|U-Y'[']'^S-^'b'lQ/d*^S0_+_+`Q1z,wS2W-Z-[Q2_-cQ3v/hQ4[0`Q5o2QQ5r2XQ5w2`R6m3zS$wi;`R*n%RU%Qi%R;`R/v*lQ$viS(k#u+YQ(o#wS)[$c$dQ*Q$xQ*Y${Q*q%WQ*r%XQ*v%]Q.Y:^Q.Z:`Q.[:bQ.x)qS.})w/PQ/R)zQ/S)|Q/T)}Q/]*UQ/b*[Q/t*jQ/u*kh0U+V.T0|2n4{6P7]7|8l9O9^9fQ0p+qQ0r+tQ2q:iQ2r:kQ2s:mQ2t._S3Y:X:YQ3m/^Q3n/_Q3r/aQ4S/|Q4k0qQ4m0tQ6T:qQ6U:sQ6Y:_Q6Z:aQ6[:cQ6a3fQ6h3pQ6l3xQ6r4OQ6t4WQ6v4YQ8R:nQ8S:jQ8T:lQ8]6gQ8a6pQ9Q:rQ9R:tQ9S8XQ9g:wQ9p:xQ;Q;`Q;^;hQ;_;iQ;j;lR;k;mnpOXst!Z#c%f&i&k&l&n,b,g1g1jQ!fPS#eZ#nQ&s!`U'_!o4r7ZQ'u#RQ(x#{Q)i$mS,Z&b&eQ,`&fQ,m&rQ,r&zQ-U'XQ.f(vQ.v)jQ0Q*|Q0X+WQ1c,_Q2U-WQ2l.UQ3a.qQ4Q/zQ4y0}Q5[1_Q5]1`Q5a1bQ5c1dQ5h1lQ6O2oQ6_3^Q7_4|Q7k5^Q7l5_Q7n5bQ8O6SQ8m7`R8w7o#WcOPXZst!Z!`!o#c#n#{%f&b&e&f&i&k&l&n&r&z'X(v*|+W,_,b,g-W.U/z0}1_1`1b1d1g1j1l2o4r4|5^5_5b6S7Z7`7oQ#XWQ#dYQ%juQ%kvS%mw!gS'x#V'{Q(O#YQ(j#tQ(q#xQ(y$OQ(z$PQ({$QQ(|$RQ(}$SQ)O$TQ)P$UQ)Q$VQ)R$WQ)S$XQ)T$YQ)V$[Q)Y$aQ)^$eW)h$m)j.q3^Q+T%lQ+i%yS,x'O1{Q-g'iS-l'y-nQ-q(RQ-s(YQ.^(nQ.d(rQ.h9qQ.j9tQ.k9uQ.l9xQ.{)uQ/}*xQ1v,sQ1y,vQ2Z-`Q2b-tQ2v.bQ2{9yQ2|9zQ2}9{Q3O9|Q3P9}Q3Q:OQ3R:PQ3S:QQ3T:RQ3U:SQ3V:TQ3W:UQ3X.iQ3[:ZQ3]:dQ3b:VQ4T0PQ4]0aQ5n:eQ5t2]Q5y2cQ6V2wQ6W:fQ6]:hQ6^:oQ7U4pQ7s5lQ7w5uQ8Q:pQ8U:uQ8V:vQ8{7yQ9Z8hQ9b8yQ9s#RR;V;cR#ZWR'Q!eY!tQ'V-S0z4uS&|!e,zQ'b!rS'l!u!xS'n!y4wS,w&}'US-c'c'dQ-e'eQ2Q-QR2`-dR(p#wR(s#xQ!fQT-R'V-S]!qQ!r'V-S0z4uQ#o]R'`9rT#jZ%^S#iZ%^S%dm,^U(]#g#h#kS-w(^(_Q-{(`Q0R*}Q2e-xU2f-y-z-|S5{2g2hR7z5|`#]W#V#Y%a'y(S*z-rr#fZm#g#h#k%^(^(_(`*}-x-y-z-|2g2h5|Q1a,^Q1w,tQ5j1oQ7r5kT:}'O*{T#`W%aS#_W%aS'z#V(SS(P#Y*zS,y'O*{T-m'y-rT'T!e%bQ$kfR)o$pT)d$k)eR3`.pT*T$x*VR*]${Q0V+VQ2j.TQ4x0|Q6Q2nQ7^4{Q7}6PQ8j7]Q8|7|Q9]8lQ9e9OQ9j9^R9m9fnqOXst!Z#c%f&i&k&l&n,b,g1g1jQ&c!VR,V&`tmOXst!U!V!Z#c%f&`&i&k&l&n,b,g1g1jR,^&fT%em,^R0v+vR,U&^Q%||R+n%}R+d%wT&g!W&jT&h!W&jT1i,g1j",
  nodeNames: "\u26A0 ArithOp ArithOp LineComment BlockComment Script Hashbang ExportDeclaration export Star as VariableName String Escape from ; default FunctionDeclaration async function VariableDefinition > TypeParamList TypeDefinition extends ThisType this LiteralType ArithOp Number BooleanLiteral TemplateType InterpolationEnd Interpolation InterpolationStart NullType null VoidType void TypeofType typeof MemberExpression . ?. PropertyName [ TemplateString Escape Interpolation super RegExp ] ArrayExpression Spread , } { ObjectExpression Property async get set PropertyDefinition Block : NewExpression new TypeArgList CompareOp < ) ( ArgList UnaryExpression delete LogicOp BitOp YieldExpression yield AwaitExpression await ParenthesizedExpression ClassExpression class ClassBody MethodDeclaration Decorator @ MemberExpression PrivatePropertyName CallExpression declare Privacy static abstract override PrivatePropertyDefinition PropertyDeclaration readonly accessor Optional TypeAnnotation Equals StaticBlock FunctionExpression ArrowFunction ParamList ParamList ArrayPattern ObjectPattern PatternProperty Privacy readonly Arrow MemberExpression BinaryExpression ArithOp ArithOp ArithOp ArithOp BitOp CompareOp instanceof satisfies in const CompareOp BitOp BitOp BitOp LogicOp LogicOp ConditionalExpression LogicOp LogicOp AssignmentExpression UpdateOp PostfixExpression CallExpression TaggedTemplateExpression DynamicImport import ImportMeta JSXElement JSXSelfCloseEndTag JSXStartTag JSXSelfClosingTag JSXIdentifier JSXBuiltin JSXIdentifier JSXNamespacedName JSXMemberExpression JSXSpreadAttribute JSXAttribute JSXAttributeValue JSXEscape JSXEndTag JSXOpenTag JSXFragmentTag JSXText JSXEscape JSXStartCloseTag JSXCloseTag PrefixCast ArrowFunction TypeParamList SequenceExpression KeyofType keyof UniqueType unique ImportType InferredType infer TypeName ParenthesizedType FunctionSignature ParamList NewSignature IndexedType TupleType Label ArrayType ReadonlyType ObjectType MethodType PropertyType IndexSignature PropertyDefinition CallSignature TypePredicate is NewSignature new UnionType LogicOp IntersectionType LogicOp ConditionalType ParameterizedType ClassDeclaration abstract implements type VariableDeclaration let var using TypeAliasDeclaration InterfaceDeclaration interface EnumDeclaration enum EnumBody NamespaceDeclaration namespace module AmbientDeclaration declare GlobalDeclaration global ClassDeclaration ClassBody AmbientFunctionDeclaration ExportGroup VariableName VariableName ImportDeclaration ImportGroup ForStatement for ForSpec ForInSpec ForOfSpec of WhileStatement while WithStatement with DoStatement do IfStatement if else SwitchStatement switch SwitchBody CaseLabel case DefaultLabel TryStatement try CatchClause catch FinallyClause finally ReturnStatement return ThrowStatement throw BreakStatement break ContinueStatement continue DebuggerStatement debugger LabeledStatement ExpressionStatement SingleExpression SingleClassItem",
  maxTerm: 367,
  context: trackNewline,
  nodeProps: [
    ["group", -26, 7, 15, 17, 63, 200, 204, 208, 209, 211, 214, 217, 227, 229, 235, 237, 239, 241, 244, 250, 256, 258, 260, 262, 264, 266, 267, "Statement", -32, 11, 12, 26, 29, 30, 36, 46, 49, 50, 52, 57, 65, 73, 77, 79, 81, 82, 104, 105, 114, 115, 132, 135, 137, 138, 139, 140, 142, 143, 163, 164, 166, "Expression", -23, 25, 27, 31, 35, 37, 39, 167, 169, 171, 172, 174, 175, 176, 178, 179, 180, 182, 183, 184, 194, 196, 198, 199, "Type", -3, 85, 97, 103, "ClassItem"],
    ["openedBy", 32, "InterpolationStart", 51, "[", 55, "{", 70, "(", 144, "JSXStartTag", 156, "JSXStartTag JSXStartCloseTag"],
    ["closedBy", 34, "InterpolationEnd", 45, "]", 56, "}", 71, ")", 145, "JSXSelfCloseEndTag JSXEndTag", 161, "JSXEndTag"]
  ],
  propSources: [jsHighlight],
  skippedNodes: [0, 3, 4, 270],
  repeatNodeCount: 33,
  tokenData: "$Fl(CSR!bOX%ZXY+gYZ-yZ[+g[]%Z]^.c^p%Zpq+gqr/mrs3cst:_tuEruvJSvwLkwx! Yxy!'iyz!(sz{!)}{|!,q|}!.O}!O!,q!O!P!/Y!P!Q!9j!Q!R#8g!R![#:v![!]#Gv!]!^#IS!^!_#J^!_!`#Nu!`!a$#a!a!b$(n!b!c$,m!c!}Er!}#O$-w#O#P$/R#P#Q$4j#Q#R$5t#R#SEr#S#T$7R#T#o$8]#o#p$<m#p#q$=c#q#r$>s#r#s$@P#s$f%Z$f$g+g$g#BYEr#BY#BZ$AZ#BZ$ISEr$IS$I_$AZ$I_$I|Er$I|$I}$Df$I}$JO$Df$JO$JTEr$JT$JU$AZ$JU$KVEr$KV$KW$AZ$KW&FUEr&FU&FV$AZ&FV;'SEr;'S;=`I|<%l?HTEr?HT?HU$AZ?HUOEr(n%d_$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z&j&hT$e&jO!^&c!_#o&c#p;'S&c;'S;=`&w<%lO&c&j&zP;=`<%l&c'|'U]$e&j'|!bOY&}YZ&cZw&}wx&cx!^&}!^!_'}!_#O&}#O#P&c#P#o&}#o#p'}#p;'S&};'S;=`(l<%lO&}!b(SU'|!bOY'}Zw'}x#O'}#P;'S'};'S;=`(f<%lO'}!b(iP;=`<%l'}'|(oP;=`<%l&}'[(y]$e&j'ypOY(rYZ&cZr(rrs&cs!^(r!^!_)r!_#O(r#O#P&c#P#o(r#o#p)r#p;'S(r;'S;=`*a<%lO(rp)wU'ypOY)rZr)rs#O)r#P;'S)r;'S;=`*Z<%lO)rp*^P;=`<%l)r'[*dP;=`<%l(r#S*nX'yp'|!bOY*gZr*grs'}sw*gwx)rx#O*g#P;'S*g;'S;=`+Z<%lO*g#S+^P;=`<%l*g(n+dP;=`<%l%Z(CS+rq$e&j'yp'|!b'o(;dOX%ZXY+gYZ&cZ[+g[p%Zpq+gqr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p$f%Z$f$g+g$g#BY%Z#BY#BZ+g#BZ$IS%Z$IS$I_+g$I_$JT%Z$JT$JU+g$JU$KV%Z$KV$KW+g$KW&FU%Z&FU&FV+g&FV;'S%Z;'S;=`+a<%l?HT%Z?HT?HU+g?HUO%Z(CS.ST'z#S$e&j'p(;dO!^&c!_#o&c#p;'S&c;'S;=`&w<%lO&c(CS.n_$e&j'yp'|!b'p(;dOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#`/x`$e&j!m$Ip'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`0z!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#S1V`#r$Id$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`2X!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#S2d_#r$Id$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$2b3l_'x$(n$e&j'|!bOY4kYZ5qZr4krs7nsw4kwx5qx!^4k!^!_8p!_#O4k#O#P5q#P#o4k#o#p8p#p;'S4k;'S;=`:X<%lO4k*r4r_$e&j'|!bOY4kYZ5qZr4krs7nsw4kwx5qx!^4k!^!_8p!_#O4k#O#P5q#P#o4k#o#p8p#p;'S4k;'S;=`:X<%lO4k)`5vX$e&jOr5qrs6cs!^5q!^!_6y!_#o5q#o#p6y#p;'S5q;'S;=`7h<%lO5q)`6jT$`#t$e&jO!^&c!_#o&c#p;'S&c;'S;=`&w<%lO&c#t6|TOr6yrs7]s;'S6y;'S;=`7b<%lO6y#t7bO$`#t#t7eP;=`<%l6y)`7kP;=`<%l5q*r7w]$`#t$e&j'|!bOY&}YZ&cZw&}wx&cx!^&}!^!_'}!_#O&}#O#P&c#P#o&}#o#p'}#p;'S&};'S;=`(l<%lO&}%W8uZ'|!bOY8pYZ6yZr8prs9hsw8pwx6yx#O8p#O#P6y#P;'S8p;'S;=`:R<%lO8p%W9oU$`#t'|!bOY'}Zw'}x#O'}#P;'S'};'S;=`(f<%lO'}%W:UP;=`<%l8p*r:[P;=`<%l4k#%|:hh$e&j'yp'|!bOY%ZYZ&cZq%Zqr<Srs&}st%ZtuCruw%Zwx(rx!^%Z!^!_*g!_!c%Z!c!}Cr!}#O%Z#O#P&c#P#R%Z#R#SCr#S#T%Z#T#oCr#o#p*g#p$g%Z$g;'SCr;'S;=`El<%lOCr(r<__US$e&j'yp'|!bOY<SYZ&cZr<Srs=^sw<Swx@nx!^<S!^!_Bm!_#O<S#O#P>`#P#o<S#o#pBm#p;'S<S;'S;=`Cl<%lO<S(Q=g]US$e&j'|!bOY=^YZ&cZw=^wx>`x!^=^!^!_?q!_#O=^#O#P>`#P#o=^#o#p?q#p;'S=^;'S;=`@h<%lO=^&n>gXUS$e&jOY>`YZ&cZ!^>`!^!_?S!_#o>`#o#p?S#p;'S>`;'S;=`?k<%lO>`S?XSUSOY?SZ;'S?S;'S;=`?e<%lO?SS?hP;=`<%l?S&n?nP;=`<%l>`!f?xWUS'|!bOY?qZw?qwx?Sx#O?q#O#P?S#P;'S?q;'S;=`@b<%lO?q!f@eP;=`<%l?q(Q@kP;=`<%l=^'`@w]US$e&j'ypOY@nYZ&cZr@nrs>`s!^@n!^!_Ap!_#O@n#O#P>`#P#o@n#o#pAp#p;'S@n;'S;=`Bg<%lO@ntAwWUS'ypOYApZrAprs?Ss#OAp#O#P?S#P;'SAp;'S;=`Ba<%lOAptBdP;=`<%lAp'`BjP;=`<%l@n#WBvYUS'yp'|!bOYBmZrBmrs?qswBmwxApx#OBm#O#P?S#P;'SBm;'S;=`Cf<%lOBm#WCiP;=`<%lBm(rCoP;=`<%l<S#%|C}i$e&j(c!L^'yp'|!bOY%ZYZ&cZr%Zrs&}st%ZtuCruw%Zwx(rx!Q%Z!Q![Cr![!^%Z!^!_*g!_!c%Z!c!}Cr!}#O%Z#O#P&c#P#R%Z#R#SCr#S#T%Z#T#oCr#o#p*g#p$g%Z$g;'SCr;'S;=`El<%lOCr#%|EoP;=`<%lCr(CSFRk$e&j'yp'|!b(W!LY'v&;d$X#tOY%ZYZ&cZr%Zrs&}st%ZtuEruw%Zwx(rx}%Z}!OGv!O!Q%Z!Q![Er![!^%Z!^!_*g!_!c%Z!c!}Er!}#O%Z#O#P&c#P#R%Z#R#SEr#S#T%Z#T#oEr#o#p*g#p$g%Z$g;'SEr;'S;=`I|<%lOEr+dHRk$e&j'yp'|!b$X#tOY%ZYZ&cZr%Zrs&}st%ZtuGvuw%Zwx(rx}%Z}!OGv!O!Q%Z!Q![Gv![!^%Z!^!_*g!_!c%Z!c!}Gv!}#O%Z#O#P&c#P#R%Z#R#SGv#S#T%Z#T#oGv#o#p*g#p$g%Z$g;'SGv;'S;=`Iv<%lOGv+dIyP;=`<%lGv(CSJPP;=`<%lEr%#SJ_`$e&j'yp'|!b#j$IdOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#SKl_$e&j#|$Id'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%DfLva(l%<v$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sv%ZvwM{wx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#SNW`$e&j#v$Id'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$2b! c_'{$)`$e&j'ypOY!!bYZ!#hZr!!brs!#hsw!!bwx!$xx!^!!b!^!_!%z!_#O!!b#O#P!#h#P#o!!b#o#p!%z#p;'S!!b;'S;=`!'c<%lO!!b*Q!!i_$e&j'ypOY!!bYZ!#hZr!!brs!#hsw!!bwx!$xx!^!!b!^!_!%z!_#O!!b#O#P!#h#P#o!!b#o#p!%z#p;'S!!b;'S;=`!'c<%lO!!b)`!#mX$e&jOw!#hwx6cx!^!#h!^!_!$Y!_#o!#h#o#p!$Y#p;'S!#h;'S;=`!$r<%lO!#h#t!$]TOw!$Ywx7]x;'S!$Y;'S;=`!$l<%lO!$Y#t!$oP;=`<%l!$Y)`!$uP;=`<%l!#h*Q!%R]$`#t$e&j'ypOY(rYZ&cZr(rrs&cs!^(r!^!_)r!_#O(r#O#P&c#P#o(r#o#p)r#p;'S(r;'S;=`*a<%lO(r$f!&PZ'ypOY!%zYZ!$YZr!%zrs!$Ysw!%zwx!&rx#O!%z#O#P!$Y#P;'S!%z;'S;=`!']<%lO!%z$f!&yU$`#t'ypOY)rZr)rs#O)r#P;'S)r;'S;=`*Z<%lO)r$f!'`P;=`<%l!%z*Q!'fP;=`<%l!!b(*Q!'t_!i(!b$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z!'l!)O_!hM|$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'+h!*[b$e&j'yp'|!b'w#)d#k$IdOY%ZYZ&cZr%Zrs&}sw%Zwx(rxz%Zz{!+d{!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#S!+o`$e&j'yp'|!b#h$IdOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z&-O!,|`$e&j'yp'|!bl&%`OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z&C[!.Z_!W&;l$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(CS!/ec$e&j'yp'|!bz'<nOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!O%Z!O!P!0p!P!Q%Z!Q![!3Y![!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z!'d!0ya$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!O%Z!O!P!2O!P!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z!'d!2Z_!VMt$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l!3eg$e&j'yp'|!bm$'|OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q![!3Y![!^%Z!^!_*g!_!g%Z!g!h!4|!h#O%Z#O#P&c#P#R%Z#R#S!3Y#S#X%Z#X#Y!4|#Y#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l!5Vg$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx{%Z{|!6n|}%Z}!O!6n!O!Q%Z!Q![!8S![!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S!8S#S#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l!6wc$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q![!8S![!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S!8S#S#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l!8_c$e&j'yp'|!bm$'|OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q![!8S![!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S!8S#S#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(CS!9uf$e&j'yp'|!b#i$IdOY!;ZYZ&cZr!;Zrs!<nsw!;Zwx!Kpxz!;Zz{#,f{!P!;Z!P!Q#-{!Q!^!;Z!^!_#'Z!_!`#5k!`!a#7Q!a!}!;Z!}#O#*}#O#P!Dj#P#o!;Z#o#p#'Z#p;'S!;Z;'S;=`#,`<%lO!;Z(r!;fb$e&j'yp'|!b!SSOY!;ZYZ&cZr!;Zrs!<nsw!;Zwx!Kpx!P!;Z!P!Q#%Z!Q!^!;Z!^!_#'Z!_!}!;Z!}#O#*}#O#P!Dj#P#o!;Z#o#p#'Z#p;'S!;Z;'S;=`#,`<%lO!;Z(Q!<w`$e&j'|!b!SSOY!<nYZ&cZw!<nwx!=yx!P!<n!P!Q!Eb!Q!^!<n!^!_!GY!_!}!<n!}#O!Ja#O#P!Dj#P#o!<n#o#p!GY#p;'S!<n;'S;=`!Kj<%lO!<n&n!>Q^$e&j!SSOY!=yYZ&cZ!P!=y!P!Q!>|!Q!^!=y!^!_!@Y!_!}!=y!}#O!Bw#O#P!Dj#P#o!=y#o#p!@Y#p;'S!=y;'S;=`!E[<%lO!=y&n!?Ta$e&j!SSO!^&c!_#Z&c#Z#[!>|#[#]&c#]#^!>|#^#a&c#a#b!>|#b#g&c#g#h!>|#h#i&c#i#j!>|#j#m&c#m#n!>|#n#o&c#p;'S&c;'S;=`&w<%lO&cS!@_X!SSOY!@YZ!P!@Y!P!Q!@z!Q!}!@Y!}#O!Ac#O#P!Bb#P;'S!@Y;'S;=`!Bq<%lO!@YS!APU!SS#Z#[!@z#]#^!@z#a#b!@z#g#h!@z#i#j!@z#m#n!@zS!AfVOY!AcZ#O!Ac#O#P!A{#P#Q!@Y#Q;'S!Ac;'S;=`!B[<%lO!AcS!BOSOY!AcZ;'S!Ac;'S;=`!B[<%lO!AcS!B_P;=`<%l!AcS!BeSOY!@YZ;'S!@Y;'S;=`!Bq<%lO!@YS!BtP;=`<%l!@Y&n!B|[$e&jOY!BwYZ&cZ!^!Bw!^!_!Ac!_#O!Bw#O#P!Cr#P#Q!=y#Q#o!Bw#o#p!Ac#p;'S!Bw;'S;=`!Dd<%lO!Bw&n!CwX$e&jOY!BwYZ&cZ!^!Bw!^!_!Ac!_#o!Bw#o#p!Ac#p;'S!Bw;'S;=`!Dd<%lO!Bw&n!DgP;=`<%l!Bw&n!DoX$e&jOY!=yYZ&cZ!^!=y!^!_!@Y!_#o!=y#o#p!@Y#p;'S!=y;'S;=`!E[<%lO!=y&n!E_P;=`<%l!=y(Q!Eki$e&j'|!b!SSOY&}YZ&cZw&}wx&cx!^&}!^!_'}!_#O&}#O#P&c#P#Z&}#Z#[!Eb#[#]&}#]#^!Eb#^#a&}#a#b!Eb#b#g&}#g#h!Eb#h#i&}#i#j!Eb#j#m&}#m#n!Eb#n#o&}#o#p'}#p;'S&};'S;=`(l<%lO&}!f!GaZ'|!b!SSOY!GYZw!GYwx!@Yx!P!GY!P!Q!HS!Q!}!GY!}#O!Ic#O#P!Bb#P;'S!GY;'S;=`!JZ<%lO!GY!f!HZb'|!b!SSOY'}Zw'}x#O'}#P#Z'}#Z#[!HS#[#]'}#]#^!HS#^#a'}#a#b!HS#b#g'}#g#h!HS#h#i'}#i#j!HS#j#m'}#m#n!HS#n;'S'};'S;=`(f<%lO'}!f!IhX'|!bOY!IcZw!Icwx!Acx#O!Ic#O#P!A{#P#Q!GY#Q;'S!Ic;'S;=`!JT<%lO!Ic!f!JWP;=`<%l!Ic!f!J^P;=`<%l!GY(Q!Jh^$e&j'|!bOY!JaYZ&cZw!Jawx!Bwx!^!Ja!^!_!Ic!_#O!Ja#O#P!Cr#P#Q!<n#Q#o!Ja#o#p!Ic#p;'S!Ja;'S;=`!Kd<%lO!Ja(Q!KgP;=`<%l!Ja(Q!KmP;=`<%l!<n'`!Ky`$e&j'yp!SSOY!KpYZ&cZr!Kprs!=ys!P!Kp!P!Q!L{!Q!^!Kp!^!_!Ns!_!}!Kp!}#O##z#O#P!Dj#P#o!Kp#o#p!Ns#p;'S!Kp;'S;=`#%T<%lO!Kp'`!MUi$e&j'yp!SSOY(rYZ&cZr(rrs&cs!^(r!^!_)r!_#O(r#O#P&c#P#Z(r#Z#[!L{#[#](r#]#^!L{#^#a(r#a#b!L{#b#g(r#g#h!L{#h#i(r#i#j!L{#j#m(r#m#n!L{#n#o(r#o#p)r#p;'S(r;'S;=`*a<%lO(rt!NzZ'yp!SSOY!NsZr!Nsrs!@Ys!P!Ns!P!Q# m!Q!}!Ns!}#O#!|#O#P!Bb#P;'S!Ns;'S;=`##t<%lO!Nst# tb'yp!SSOY)rZr)rs#O)r#P#Z)r#Z#[# m#[#])r#]#^# m#^#a)r#a#b# m#b#g)r#g#h# m#h#i)r#i#j# m#j#m)r#m#n# m#n;'S)r;'S;=`*Z<%lO)rt##RX'ypOY#!|Zr#!|rs!Acs#O#!|#O#P!A{#P#Q!Ns#Q;'S#!|;'S;=`##n<%lO#!|t##qP;=`<%l#!|t##wP;=`<%l!Ns'`#$R^$e&j'ypOY##zYZ&cZr##zrs!Bws!^##z!^!_#!|!_#O##z#O#P!Cr#P#Q!Kp#Q#o##z#o#p#!|#p;'S##z;'S;=`#$}<%lO##z'`#%QP;=`<%l##z'`#%WP;=`<%l!Kp(r#%fk$e&j'yp'|!b!SSOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#Z%Z#Z#[#%Z#[#]%Z#]#^#%Z#^#a%Z#a#b#%Z#b#g%Z#g#h#%Z#h#i%Z#i#j#%Z#j#m%Z#m#n#%Z#n#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z#W#'d]'yp'|!b!SSOY#'ZZr#'Zrs!GYsw#'Zwx!Nsx!P#'Z!P!Q#(]!Q!}#'Z!}#O#)w#O#P!Bb#P;'S#'Z;'S;=`#*w<%lO#'Z#W#(fe'yp'|!b!SSOY*gZr*grs'}sw*gwx)rx#O*g#P#Z*g#Z#[#(]#[#]*g#]#^#(]#^#a*g#a#b#(]#b#g*g#g#h#(]#h#i*g#i#j#(]#j#m*g#m#n#(]#n;'S*g;'S;=`+Z<%lO*g#W#*OZ'yp'|!bOY#)wZr#)wrs!Icsw#)wwx#!|x#O#)w#O#P!A{#P#Q#'Z#Q;'S#)w;'S;=`#*q<%lO#)w#W#*tP;=`<%l#)w#W#*zP;=`<%l#'Z(r#+W`$e&j'yp'|!bOY#*}YZ&cZr#*}rs!Jasw#*}wx##zx!^#*}!^!_#)w!_#O#*}#O#P!Cr#P#Q!;Z#Q#o#*}#o#p#)w#p;'S#*};'S;=`#,Y<%lO#*}(r#,]P;=`<%l#*}(r#,cP;=`<%l!;Z(CS#,sb$e&j'yp'|!b'q(;d!SSOY!;ZYZ&cZr!;Zrs!<nsw!;Zwx!Kpx!P!;Z!P!Q#%Z!Q!^!;Z!^!_#'Z!_!}!;Z!}#O#*}#O#P!Dj#P#o!;Z#o#p#'Z#p;'S!;Z;'S;=`#,`<%lO!;Z(CS#.W_$e&j'yp'|!bR(;dOY#-{YZ&cZr#-{rs#/Vsw#-{wx#2gx!^#-{!^!_#4f!_#O#-{#O#P#0X#P#o#-{#o#p#4f#p;'S#-{;'S;=`#5e<%lO#-{(Bb#/`]$e&j'|!bR(;dOY#/VYZ&cZw#/Vwx#0Xx!^#/V!^!_#1j!_#O#/V#O#P#0X#P#o#/V#o#p#1j#p;'S#/V;'S;=`#2a<%lO#/V(AO#0`X$e&jR(;dOY#0XYZ&cZ!^#0X!^!_#0{!_#o#0X#o#p#0{#p;'S#0X;'S;=`#1d<%lO#0X(;d#1QSR(;dOY#0{Z;'S#0{;'S;=`#1^<%lO#0{(;d#1aP;=`<%l#0{(AO#1gP;=`<%l#0X(<v#1qW'|!bR(;dOY#1jZw#1jwx#0{x#O#1j#O#P#0{#P;'S#1j;'S;=`#2Z<%lO#1j(<v#2^P;=`<%l#1j(Bb#2dP;=`<%l#/V(Ap#2p]$e&j'ypR(;dOY#2gYZ&cZr#2grs#0Xs!^#2g!^!_#3i!_#O#2g#O#P#0X#P#o#2g#o#p#3i#p;'S#2g;'S;=`#4`<%lO#2g(<U#3pW'ypR(;dOY#3iZr#3irs#0{s#O#3i#O#P#0{#P;'S#3i;'S;=`#4Y<%lO#3i(<U#4]P;=`<%l#3i(Ap#4cP;=`<%l#2g(=h#4oY'yp'|!bR(;dOY#4fZr#4frs#1jsw#4fwx#3ix#O#4f#O#P#0{#P;'S#4f;'S;=`#5_<%lO#4f(=h#5bP;=`<%l#4f(CS#5hP;=`<%l#-{%#W#5xb$e&j#|$Id'yp'|!b!SSOY!;ZYZ&cZr!;Zrs!<nsw!;Zwx!Kpx!P!;Z!P!Q#%Z!Q!^!;Z!^!_#'Z!_!}!;Z!}#O#*}#O#P!Dj#P#o!;Z#o#p#'Z#p;'S!;Z;'S;=`#,`<%lO!;Z+h#7_b$U#t$e&j'yp'|!b!SSOY!;ZYZ&cZr!;Zrs!<nsw!;Zwx!Kpx!P!;Z!P!Q#%Z!Q!^!;Z!^!_#'Z!_!}!;Z!}#O#*}#O#P!Dj#P#o!;Z#o#p#'Z#p;'S!;Z;'S;=`#,`<%lO!;Z$/l#8rp$e&j'yp'|!bm$'|OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!O%Z!O!P!3Y!P!Q%Z!Q![#:v![!^%Z!^!_*g!_!g%Z!g!h!4|!h#O%Z#O#P&c#P#R%Z#R#S#:v#S#U%Z#U#V#>Q#V#X%Z#X#Y!4|#Y#b%Z#b#c#<v#c#d#AY#d#l%Z#l#m#D[#m#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l#;Rk$e&j'yp'|!bm$'|OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!O%Z!O!P!3Y!P!Q%Z!Q![#:v![!^%Z!^!_*g!_!g%Z!g!h!4|!h#O%Z#O#P&c#P#R%Z#R#S#:v#S#X%Z#X#Y!4|#Y#b%Z#b#c#<v#c#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l#=R_$e&j'yp'|!bm$'|OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l#>Zd$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q!R#?i!R!S#?i!S!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S#?i#S#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l#?tf$e&j'yp'|!bm$'|OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q!R#?i!R!S#?i!S!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S#?i#S#b%Z#b#c#<v#c#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l#Acc$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q!Y#Bn!Y!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S#Bn#S#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l#Bye$e&j'yp'|!bm$'|OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q!Y#Bn!Y!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S#Bn#S#b%Z#b#c#<v#c#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l#Deg$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q![#E|![!^%Z!^!_*g!_!c%Z!c!i#E|!i#O%Z#O#P&c#P#R%Z#R#S#E|#S#T%Z#T#Z#E|#Z#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l#FXi$e&j'yp'|!bm$'|OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q![#E|![!^%Z!^!_*g!_!c%Z!c!i#E|!i#O%Z#O#P&c#P#R%Z#R#S#E|#S#T%Z#T#Z#E|#Z#b%Z#b#c#<v#c#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%Gh#HT_!b$b$e&j#z%<f'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z)[#I___l$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(CS#Jm^(P!*v!f'.r'yp'|!b$V)d(pSOY*gZr*grs'}sw*gwx)rx!P*g!P!Q#Ki!Q!^*g!^!_#L_!_!`#NP!`#O*g#P;'S*g;'S;=`+Z<%lO*g(n#KrX$g&j'yp'|!bOY*gZr*grs'}sw*gwx)rx#O*g#P;'S*g;'S;=`+Z<%lO*g$Kh#LhZ#l$Id'yp'|!bOY*gZr*grs'}sw*gwx)rx!_*g!_!`#MZ!`#O*g#P;'S*g;'S;=`+Z<%lO*g$Kh#MdX#|$Id'yp'|!bOY*gZr*grs'}sw*gwx)rx#O*g#P;'S*g;'S;=`+Z<%lO*g$Kh#NYX#m$Id'yp'|!bOY*gZr*grs'}sw*gwx)rx#O*g#P;'S*g;'S;=`+Z<%lO*g%Gh$ Qa#Y%?x$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`0z!`!a$!V!a#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#W$!b_#e$Ih$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%Gh$#paeBf#m$Id$b#|$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`$$u!`!a$&P!a#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#S$%Q_#m$Id$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#S$&[a#l$Id$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`!a$'a!a#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#S$'l`#l$Id$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'+h$(yc(d$Ip$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!O%Z!O!P$*U!P!^%Z!^!_*g!_!a%Z!a!b$+`!b#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'+`$*a_{'#p$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#S$+k`$e&j#w$Id'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z#&^$,x_!y!Ln$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(@^$.S_}(8n$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(n$/WZ$e&jO!^$/y!^!_$0a!_#i$/y#i#j$0f#j#l$/y#l#m$2X#m#o$/y#o#p$0a#p;'S$/y;'S;=`$4d<%lO$/y(n$0QT]#S$e&jO!^&c!_#o&c#p;'S&c;'S;=`&w<%lO&c#S$0fO]#S(n$0k[$e&jO!Q&c!Q![$1a![!^&c!_!c&c!c!i$1a!i#T&c#T#Z$1a#Z#o&c#o#p$3w#p;'S&c;'S;=`&w<%lO&c(n$1fZ$e&jO!Q&c!Q![$2X![!^&c!_!c&c!c!i$2X!i#T&c#T#Z$2X#Z#o&c#p;'S&c;'S;=`&w<%lO&c(n$2^Z$e&jO!Q&c!Q![$3P![!^&c!_!c&c!c!i$3P!i#T&c#T#Z$3P#Z#o&c#p;'S&c;'S;=`&w<%lO&c(n$3UZ$e&jO!Q&c!Q![$/y![!^&c!_!c&c!c!i$/y!i#T&c#T#Z$/y#Z#o&c#p;'S&c;'S;=`&w<%lO&c#S$3zR!Q![$4T!c!i$4T#T#Z$4T#S$4WS!Q![$4T!c!i$4T#T#Z$4T#q#r$0a(n$4gP;=`<%l$/y!2r$4u_!T!+S$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#S$6P`#t$Id$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z&,v$7^_$e&j'yp'|!b(T&%WOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(CS$8lk$e&j'yp'|!b(W!LY'v&;d$Z#tOY%ZYZ&cZr%Zrs&}st%Ztu$8]uw%Zwx(rx}%Z}!O$:a!O!Q%Z!Q![$8]![!^%Z!^!_*g!_!c%Z!c!}$8]!}#O%Z#O#P&c#P#R%Z#R#S$8]#S#T%Z#T#o$8]#o#p*g#p$g%Z$g;'S$8];'S;=`$<g<%lO$8]+d$:lk$e&j'yp'|!b$Z#tOY%ZYZ&cZr%Zrs&}st%Ztu$:auw%Zwx(rx}%Z}!O$:a!O!Q%Z!Q![$:a![!^%Z!^!_*g!_!c%Z!c!}$:a!}#O%Z#O#P&c#P#R%Z#R#S$:a#S#T%Z#T#o$:a#o#p*g#p$g%Z$g;'S$:a;'S;=`$<a<%lO$:a+d$<dP;=`<%l$:a(CS$<jP;=`<%l$8]!5p$<vX!Y!3l'yp'|!bOY*gZr*grs'}sw*gwx)rx#O*g#P;'S*g;'S;=`+Z<%lO*g%Df$=na(k%<v$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p#q$+`#q;'S%Z;'S;=`+a<%lO%Z%#`$?Q_!X$I`p`$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(r$@[_!nS$e&j'yp'|!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(CS$Al|$e&j'yp'|!b'o(;d(W!LY'v&;d$X#tOX%ZXY+gYZ&cZ[+g[p%Zpq+gqr%Zrs&}st%ZtuEruw%Zwx(rx}%Z}!OGv!O!Q%Z!Q![Er![!^%Z!^!_*g!_!c%Z!c!}Er!}#O%Z#O#P&c#P#R%Z#R#SEr#S#T%Z#T#oEr#o#p*g#p$f%Z$f$g+g$g#BYEr#BY#BZ$AZ#BZ$ISEr$IS$I_$AZ$I_$JTEr$JT$JU$AZ$JU$KVEr$KV$KW$AZ$KW&FUEr&FU&FV$AZ&FV;'SEr;'S;=`I|<%l?HTEr?HT?HU$AZ?HUOEr(CS$Dwk$e&j'yp'|!b'p(;d(W!LY'v&;d$X#tOY%ZYZ&cZr%Zrs&}st%ZtuEruw%Zwx(rx}%Z}!OGv!O!Q%Z!Q![Er![!^%Z!^!_*g!_!c%Z!c!}Er!}#O%Z#O#P&c#P#R%Z#R#SEr#S#T%Z#T#oEr#o#p*g#p$g%Z$g;'SEr;'S;=`I|<%lOEr",
  tokenizers: [noSemicolon, incdecToken, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, insertSemicolon, new LocalTokenGroup("$S~RRtu[#O#Pg#S#T#|~_P#o#pb~gOr~~jVO#i!P#i#j!U#j#l!P#l#m!q#m;'S!P;'S;=`#v<%lO!P~!UO!P~~!XS!Q![!e!c!i!e#T#Z!e#o#p#Z~!hR!Q![!q!c!i!q#T#Z!q~!tR!Q![!}!c!i!}#T#Z!}~#QR!Q![!P!c!i!P#T#Z!P~#^R!Q![#g!c!i#g#T#Z#g~#jS!Q![#g!c!i#g#T#Z#g#q#r!P~#yP;=`<%l!P~$RO(V~~", 141, 328), new LocalTokenGroup("j~RQYZXz{^~^O's~~aP!P!Qd~iO't~~", 25, 310)],
  topRules: { Script: [0, 5], SingleExpression: [1, 268], SingleClassItem: [2, 269] },
  dialects: { jsx: 12801, ts: 12803 },
  dynamicPrecedences: { "67": 1, "77": 1, "79": 1, "164": 1, "192": 1 },
  specialized: [{ term: 314, get: (value) => spec_identifier[value] || -1 }, { term: 330, get: (value) => spec_word[value] || -1 }, { term: 68, get: (value) => spec_LessThan[value] || -1 }],
  tokenPrec: 12827
});

// /home/ray/Code/diagramatics-site/node_modules/@codemirror/lang-javascript/dist/index.js
var defID = function(type) {
  return (node, def) => {
    let id2 = node.node.getChild("VariableDefinition");
    if (id2)
      def(id2, type);
    return true;
  };
};
var getScope = function(doc2, node) {
  let cached = cache.get(node);
  if (cached)
    return cached;
  let completions = [], top2 = true;
  function def(node2, type) {
    let name2 = doc2.sliceString(node2.from, node2.to);
    completions.push({ label: name2, type });
  }
  node.cursor(IterMode.IncludeAnonymous).iterate((node2) => {
    if (top2) {
      top2 = false;
    } else if (node2.name) {
      let gather = gatherCompletions[node2.name];
      if (gather && gather(node2, def) || ScopeNodes.has(node2.name))
        return false;
    } else if (node2.to - node2.from > 8192) {
      for (let c of getScope(doc2, node2.node))
        completions.push(c);
      return false;
    }
  });
  cache.set(node, completions);
  return completions;
};
var localCompletionSource = function(context) {
  let inner = syntaxTree(context.state).resolveInner(context.pos, -1);
  if (dontComplete.indexOf(inner.name) > -1)
    return null;
  let isWord = inner.name == "VariableName" || inner.to - inner.from < 20 && Identifier.test(context.state.sliceDoc(inner.from, inner.to));
  if (!isWord && !context.explicit)
    return null;
  let options = [];
  for (let pos = inner;pos; pos = pos.parent) {
    if (ScopeNodes.has(pos.name))
      options = options.concat(getScope(context.state.doc, pos));
  }
  return {
    options,
    from: isWord ? inner.from : context.pos,
    validFor: Identifier
  };
};
var javascript2 = function(config2 = {}) {
  let lang = config2.jsx ? config2.typescript ? tsxLanguage : jsxLanguage : config2.typescript ? typescriptLanguage : javascriptLanguage;
  let completions = config2.typescript ? typescriptSnippets.concat(typescriptKeywords) : snippets.concat(keywords);
  return new LanguageSupport(lang, [
    javascriptLanguage.data.of({
      autocomplete: ifNotIn(dontComplete, completeFromList(completions))
    }),
    javascriptLanguage.data.of({
      autocomplete: localCompletionSource
    }),
    config2.jsx ? autoCloseTags : []
  ]);
};
var findOpenTag = function(node) {
  for (;; ) {
    if (node.name == "JSXOpenTag" || node.name == "JSXSelfClosingTag" || node.name == "JSXFragmentTag")
      return node;
    if (node.name == "JSXEscape" || !node.parent)
      return null;
    node = node.parent;
  }
};
var elementName = function(doc2, tree, max = doc2.length) {
  for (let ch = tree === null || tree === undefined ? undefined : tree.firstChild;ch; ch = ch.nextSibling) {
    if (ch.name == "JSXIdentifier" || ch.name == "JSXBuiltin" || ch.name == "JSXNamespacedName" || ch.name == "JSXMemberExpression")
      return doc2.sliceString(ch.from, Math.min(ch.to, max));
  }
  return "";
};
var snippets = [
  snippetCompletion("function ${name}(${params}) {\n\t${}\n}", {
    label: "function",
    detail: "definition",
    type: "keyword"
  }),
  snippetCompletion("for (let ${index} = 0; ${index} < ${bound}; ${index}++) {\n\t${}\n}", {
    label: "for",
    detail: "loop",
    type: "keyword"
  }),
  snippetCompletion("for (let ${name} of ${collection}) {\n\t${}\n}", {
    label: "for",
    detail: "of loop",
    type: "keyword"
  }),
  snippetCompletion("do {\n\t${}\n} while (${})", {
    label: "do",
    detail: "loop",
    type: "keyword"
  }),
  snippetCompletion("while (${}) {\n\t${}\n}", {
    label: "while",
    detail: "loop",
    type: "keyword"
  }),
  snippetCompletion("try {\n\t${}\n} catch (${error}) {\n\t${}\n}", {
    label: "try",
    detail: "/ catch block",
    type: "keyword"
  }),
  snippetCompletion("if (${}) {\n\t${}\n}", {
    label: "if",
    detail: "block",
    type: "keyword"
  }),
  snippetCompletion("if (${}) {\n\t${}\n} else {\n\t${}\n}", {
    label: "if",
    detail: "/ else block",
    type: "keyword"
  }),
  snippetCompletion("class ${name} {\n\tconstructor(${params}) {\n\t\t${}\n\t}\n}", {
    label: "class",
    detail: "definition",
    type: "keyword"
  }),
  snippetCompletion("import {${names}} from \"${module}\"\n${}", {
    label: "import",
    detail: "named",
    type: "keyword"
  }),
  snippetCompletion("import ${name} from \"${module}\"\n${}", {
    label: "import",
    detail: "default",
    type: "keyword"
  })
];
var typescriptSnippets = snippets.concat([
  snippetCompletion("interface ${name} {\n\t${}\n}", {
    label: "interface",
    detail: "definition",
    type: "keyword"
  }),
  snippetCompletion("type ${name} = ${type}", {
    label: "type",
    detail: "definition",
    type: "keyword"
  }),
  snippetCompletion("enum ${name} {\n\t${}\n}", {
    label: "enum",
    detail: "definition",
    type: "keyword"
  })
]);
var cache = new NodeWeakMap;
var ScopeNodes = new Set([
  "Script",
  "Block",
  "FunctionExpression",
  "FunctionDeclaration",
  "ArrowFunction",
  "MethodDeclaration",
  "ForStatement"
]);
var functionContext = ["FunctionDeclaration"];
var gatherCompletions = {
  FunctionDeclaration: defID("function"),
  ClassDeclaration: defID("class"),
  ClassExpression: () => true,
  EnumDeclaration: defID("constant"),
  TypeAliasDeclaration: defID("type"),
  NamespaceDeclaration: defID("namespace"),
  VariableDefinition(node, def) {
    if (!node.matchContext(functionContext))
      def(node, "variable");
  },
  TypeDefinition(node, def) {
    def(node, "type");
  },
  __proto__: null
};
var Identifier = /^[\w$\xa1-\uffff][\w$\d\xa1-\uffff]*$/;
var dontComplete = [
  "TemplateString",
  "String",
  "RegExp",
  "LineComment",
  "BlockComment",
  "VariableDefinition",
  "TypeDefinition",
  "Label",
  "PropertyDefinition",
  "PropertyName",
  "PrivatePropertyDefinition",
  "PrivatePropertyName",
  ".",
  "?."
];
var javascriptLanguage = LRLanguage.define({
  name: "javascript",
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        IfStatement: continuedIndent({ except: /^\s*({|else\b)/ }),
        TryStatement: continuedIndent({ except: /^\s*({|catch\b|finally\b)/ }),
        LabeledStatement: flatIndent,
        SwitchBody: (context) => {
          let after = context.textAfter, closed = /^\s*\}/.test(after), isCase = /^\s*(case|default)\b/.test(after);
          return context.baseIndent + (closed ? 0 : isCase ? 1 : 2) * context.unit;
        },
        Block: delimitedIndent({ closing: "}" }),
        ArrowFunction: (cx) => cx.baseIndent + cx.unit,
        "TemplateString BlockComment": () => null,
        "Statement Property": continuedIndent({ except: /^{/ }),
        JSXElement(context) {
          let closed = /^\s*<\//.test(context.textAfter);
          return context.lineIndent(context.node.from) + (closed ? 0 : context.unit);
        },
        JSXEscape(context) {
          let closed = /\s*\}/.test(context.textAfter);
          return context.lineIndent(context.node.from) + (closed ? 0 : context.unit);
        },
        "JSXOpenTag JSXSelfClosingTag"(context) {
          return context.column(context.node.from) + context.unit;
        }
      }),
      foldNodeProp.add({
        "Block ClassBody SwitchBody EnumBody ObjectExpression ArrayExpression ObjectType": foldInside,
        BlockComment(tree) {
          return { from: tree.from + 2, to: tree.to - 2 };
        }
      })
    ]
  }),
  languageData: {
    closeBrackets: { brackets: ["(", "[", "{", "'", '"', "`"] },
    commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
    indentOnInput: /^\s*(?:case |default:|\{|\}|<\/)$/,
    wordChars: "$"
  }
});
var jsxSublanguage = {
  test: (node) => /^JSX/.test(node.name),
  facet: defineLanguageFacet({ commentTokens: { block: { open: "{/*", close: "*/}" } } })
};
var typescriptLanguage = javascriptLanguage.configure({ dialect: "ts" }, "typescript");
var jsxLanguage = javascriptLanguage.configure({
  dialect: "jsx",
  props: [sublanguageProp.add((n) => n.isTop ? [jsxSublanguage] : undefined)]
});
var tsxLanguage = javascriptLanguage.configure({
  dialect: "jsx ts",
  props: [sublanguageProp.add((n) => n.isTop ? [jsxSublanguage] : undefined)]
}, "typescript");
var kwCompletion = (name2) => ({ label: name2, type: "keyword" });
var keywords = "break case const continue default delete export extends false finally in instanceof let new return static super switch this throw true typeof var yield".split(" ").map(kwCompletion);
var typescriptKeywords = keywords.concat(["declare", "implements", "private", "protected", "public"].map(kwCompletion));
var android2 = typeof navigator == "object" && /Android\b/.test(navigator.userAgent);
var autoCloseTags = EditorView.inputHandler.of((view8, from, to, text, defaultInsert) => {
  if ((android2 ? view8.composing : view8.compositionStarted) || view8.state.readOnly || from != to || text != ">" && text != "/" || !javascriptLanguage.isActiveAt(view8.state, from, -1))
    return false;
  let base2 = defaultInsert(), { state: state9 } = base2;
  let closeTags = state9.changeByRange((range) => {
    var _a2;
    let { head } = range, around = syntaxTree(state9).resolveInner(head - 1, -1), name2;
    if (around.name == "JSXStartTag")
      around = around.parent;
    if (state9.doc.sliceString(head - 1, head) != text || around.name == "JSXAttributeValue" && around.to > head)
      ;
    else if (text == ">" && around.name == "JSXFragmentTag") {
      return { range, changes: { from: head, insert: `</>` } };
    } else if (text == "/" && around.name == "JSXStartCloseTag") {
      let empty2 = around.parent, base3 = empty2.parent;
      if (base3 && empty2.from == head - 2 && ((name2 = elementName(state9.doc, base3.firstChild, head)) || ((_a2 = base3.firstChild) === null || _a2 === undefined ? undefined : _a2.name) == "JSXFragmentTag")) {
        let insert2 = `${name2}>`;
        return { range: EditorSelection.cursor(head + insert2.length, -1), changes: { from: head, insert: insert2 } };
      }
    } else if (text == ">") {
      let openTag = findOpenTag(around);
      if (openTag && !/^\/?>|^<\//.test(state9.doc.sliceString(head, head + 2)) && (name2 = elementName(state9.doc, openTag, head)))
        return { range, changes: { from: head, insert: `</${name2}>` } };
    }
    return { range };
  });
  if (closeTags.changes.empty)
    return false;
  view8.dispatch([
    base2,
    state9.update(closeTags, { userEvent: "input.complete", scrollIntoView: true })
  ]);
  return true;
});

// editor.js
var extension_update_listener = function(func) {
  return EditorView.updateListener.of((v) => {
    if (v.docChanged)
      func(v.state.doc);
  });
};
function handle_editor(func, initial_doc) {
  let editor = new EditorView({
    doc: initial_doc,
    extensions: [
      basicSetup,
      javascript2(),
      keymap.of([indentWithTab]),
      extension_update_listener(func),
      extension_fixed_height
    ],
    parent: document.getElementById("editor")
  });
}
var extension_fixed_height = EditorView.theme({
  "&": { height: "300px" },
  ".cm-scroller": { overflow: "auto" }
});
export {
  handle_editor
};
