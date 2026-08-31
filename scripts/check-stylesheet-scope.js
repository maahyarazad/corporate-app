// Every identifier referenced inside a module-scope StyleSheet.create MUST be
// resolvable at module scope. A component-scope const (Dimensions.get, props,
// state) throws ReferenceError at module init.
const babel=require('/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core');
const fs=require('fs'),path=require('path');
const ROOT='/Users/germanworldclub/Documents/GEC-Corporate';
const files=[];
(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
 if(e.isDirectory())walk(p); else if(/\.jsx?$/.test(e.name))files.push(p);}})(path.join(ROOT,'src'));
files.push(path.join(ROOT,'navigation.js'),path.join(ROOT,'App.js'));
let bad=0;
for(const f of files){
  let ast; try{ast=babel.parseSync(fs.readFileSync(f,'utf8'),{filename:f,cwd:ROOT,presets:['babel-preset-expo'],babelrc:false,configFile:false});}catch(e){continue;}
  babel.traverse(ast,{CallExpression(p){
    const c=p.node.callee;
    if(!(c.type==='MemberExpression'&&c.object.name==='StyleSheet'&&c.property.name==='create'))return;
    // only module-scope sheets matter
    if(p.getFunctionParent())return;
    p.traverse({Identifier(id){
      if(id.parent.type==='ObjectProperty'&&id.parent.key===id.node)return;
      if((id.parent.type==='MemberExpression'||id.parent.type==='OptionalMemberExpression')&&id.parent.property===id.node)return;
      const b=id.scope.getBinding(id.node.name);
      if(!b){ // not bound anywhere -> global or missing
        if(!['Dimensions','StyleSheet','Platform','undefined','NaN','Infinity'].includes(id.node.name)){
          console.log(`  UNRESOLVED  ${path.relative(ROOT,f)}  ->  ${id.node.name}`); bad++;
        }
        return;
      }
      if(b.scope.block.type!=='Program'){
        console.log(`  NOT MODULE SCOPE  ${path.relative(ROOT,f)}  ->  ${id.node.name} (declared in ${b.scope.block.type})`); bad++;
      }
    }});
  }});
}
console.log(bad?`\n  ${bad} problem(s)`:'\n  every module-scope StyleSheet references only module-scope bindings');
