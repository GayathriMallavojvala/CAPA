function createRecord(){
  const date=new Date();
  return {id:'QA-'+date.toISOString().slice(0,10).replaceAll('-','')+'-'+crypto.randomUUID().slice(0,8).toUpperCase(),opened:date.toLocaleDateString('en-GB'),revision:0};
}
function reportHeader(title,form){
  return '<div class="formhead"><div><div class="formcode">QUALITY ASSURANCE &nbsp; / &nbsp; '+form+'</div><h2>'+title+'</h2></div><strong>DRAFT<br><small>Engineer review</small></strong></div>';
}
function block(title,body){return '<div class="band">'+title+'</div>'+body}
function actionTable(rows){
  return table(['What','Where','When','Who','Required Results'],rows);
}
function caseForms(ranked,remaining){
  const family=current.family.replaceAll('_',' '), lead=ranked[0];
  const info=table(['Tracking number','Opened','Revision','Case status'],[[record.id,record.opened,String(record.revision).padStart(2,'0'),'Open · investigation']]);
  const process='Originating operation to be established';
  const causes=ranked.map(row=>[family,row.potential_effect,row.candidate_cause,'To be verified','To be verified','—','—','—']);
  const evidenceRows=history.map((h,i)=>['E'+(i+1),scenario.tests.find(t=>t.id===h.test).label,h.outcome.replaceAll('_',' '),h.source]);
  const check=remaining[0];
  const next=check?check.label:'Review recorded findings and any unresolved alternatives.';
  const pfmea='<section class="sheet">'+reportHeader('Process FMEA worksheet','PFMEA')+info+
    block('Scope and process function',table(['Process step','Product requirement','Reported failure'],[[process,'Obtain applicable product specification and acceptance limit.',description]]))+
    block('Failure analysis and current controls',table(['Failure mode','Potential effect','Potential cause','Prevention control','Detection control','S','O','D'],causes))+
    '<p class="formnote">S = severity · O = occurrence · D = detection. A dash marks a rating awaiting evidence and the plant scoring criteria. Priority calculation is deferred.</p>'+
    block('Review assignment',table(['Process owner','FMEA reviewer','Review date'],[['Unassigned','Pending assignment','Pending review']]))+'</section>';
  const remedies={guide_misalignment:'Restore guide alignment to the approved setting and document the measured setting after adjustment.',stuck_idler:'Restore free rotation of the identified idler under the approved maintenance procedure and record the post-maintenance check.',roll_debris:'Remove the verified deposit under the approved cleaning procedure and inspect the contact surface before release.',low_descaler_pressure:'Restore the descaler pressure to the approved process range and document the verified pressure trend.'};
  const correction=remedies[lead.id] || 'Have the process owner specify the change that removes the verified mechanism and define the post-change check.';
  const capa='<section class="sheet">'+reportHeader('Corrective & preventive action report','CAPA')+info+
    block('01 &nbsp; Case identification',table(['Submitted by','Issue source','Affected lot / coil','Investigation team'],[['Not supplied','To be confirmed','Not supplied','To be assigned']]))+
    block('02 &nbsp; Issue as reported','<p class="statement">'+esc(description)+'</p>')+
    block('03 &nbsp; Immediate containment · proposed',actionTable([['Identify the affected material and request a disposition decision.','Quality desk / affected lot','Before release review','Quality engineer¹','Record material ID, scope and disposition decision.']]))+
    block('04 &nbsp; Root cause investigation',table(['Cause status','Lead hypothesis under current assumptions','Next investigation step'],[['Cause unconfirmed',lead.candidate_cause,next]]))+
    block('05 &nbsp; Corrective action plan · conditional',actionTable([['Conditional on verifying '+lead.candidate_cause+'. '+correction,'Confirmed source operation','After cause verification','Process owner¹','Record cause evidence, approved change and implementation record.']]))+
    block('06 &nbsp; Preventive action plan · conditional',actionTable([['Review comparable equipment or operations for the verified failure mechanism and document applicable control changes.','Comparable lines / equipment','After cause confirmation','Quality lead¹','List positions reviewed, control changes and responsible owners.']]))+
    '<p class="formnote">¹ Suggested role. A named assignee and committed due date require supervisor review.</p>'+
    block('07 &nbsp; Effectiveness and closure',table(['Verification plan','Acceptance criterion','Actual result'],[['Inspect comparable material after implementation. Record both the inspected quantity and the number affected.','Engineer to agree the threshold and observation window before verification.','Pending follow-up']])+
    table(['Implementation approved by / date','Effectiveness verified by / date','Closure date','Related records'],[['Pending','Pending','Open','Pending document references']]))+'</section>';
  const annex='<section class="sheet">'+reportHeader('Investigation evidence','CASE ANNEX')+info+
    block('Inspection records',evidenceRows.length?table(['Ref.','Inspection','Finding','Source record'],evidenceRows):'<p class="statement">No inspection finding recorded.</p>')+
    block('Diagnostic ranking',table(['Candidate cause','Initial weight','Current weight'],ranked.map(r=>[r.candidate_cause,(100*r.prior_weight).toFixed(1)+'%',(100*r.current_weight).toFixed(1)+'%'])))+
    '<p class="formnote">Computed with authored scenario estimates. These weights describe relative support among modeled causes. FMEA occurrence ratings require separate evidence.</p></section>';
  return '<div class="controls reportbar"><span>Case documents · '+esc(record.id)+'</span><button onclick="print()">Print report / save PDF</button></div>'+pfmea+capa+annex;
}
