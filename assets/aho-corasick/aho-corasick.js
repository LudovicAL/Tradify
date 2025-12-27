//This code was adapted from ComputerBread's work:
//https://github.com/ComputerBread/algorithms

class Node {
   constructor() {
      this.outputs = [];
      this.children = new Map();
      this.failureLink = null;
   }

   hasChild(key) {
      return this.children.has(key);
   }

   getChild(key) {
      return this.children.get(key);
   }

   setChild(key, node) {
      this.children.set(key, node);
   }

   addOutput(output) {
      this.outputs.push(output);
   }

   copyOutputs(node) {
      for (const o of node.outputs) {
         this.outputs.push(o);
      }
   }
}

class AhoCorasick {
   constructor(patterns) {
      // construct the trie
      this.root = new Node();
      let currNode = this.root;
      for (const pattern of patterns) {
         for (let i = 0, max = pattern.length; i < max; i++) {
            const key = pattern[i];
            if (!currNode.hasChild(key)) {
               currNode.setChild(key, new Node());
            }
            currNode = currNode.getChild(key);
         }
         currNode.addOutput(pattern);
         currNode = this.root;
      }
      // failure link
      this.root.failureLink = this.root;
      const queue = [];
      for (const [_, child] of this.root.children) {
         child.failureLink = this.root;
         queue.push(child);
      }
      while (queue.length !== 0) {
         currNode = queue.shift();
         for (const [key, child] of currNode.children) {
            queue.push(child);
            let n = currNode.failureLink;
            while (!n.hasChild(key) && n != this.root) {
               n = n.failureLink;
            }
            child.failureLink = n.getChild(key) ?? this.root;
            child.copyOutputs(child.failureLink);
         }
      }
   }

   search(text) {
      let score = 0;
      let state = this.root;
      let i = 0;
      let max = text.length;
      while (i < max) {
         const c = text[i];
         if (state.hasChild(c)) {
            state = state.getChild(c);
            i++;
            score += state.outputs.length;
         } else if (state === this.root) {
            i++;
         } else {
            state = state.failureLink;
         }
      }
      return score;
   }
}
