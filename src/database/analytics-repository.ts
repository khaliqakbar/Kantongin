import type { SQLiteDatabase } from 'expo-sqlite';
import type { Transaction } from './types';
export type ReportCategory = { category_id:number; name:string; icon:string; amount:number; count:number };
export type ReportDay = { day:string; income:number; expense:number };
export type FinanceReport = { period:string; income:number; expense:number; previousExpense:number; net:number; days:ReportDay[]; expensesByCategory:ReportCategory[]; transactions:Transaction[] };
const validPeriod=(p:string)=>/^\d{4}-(0[1-9]|1[0-2])$/.test(p);
const periodBounds=(p:string)=>{const [y,m]=p.split('-').map(Number);const start=`${p}-01`;const end=`${p}-${String(new Date(Date.UTC(y,m,0)).getUTCDate()).padStart(2,'0')}`;const previous=new Date(Date.UTC(y,m-2,1));return{start,end,previous:`${previous.getUTCFullYear()}-${String(previous.getUTCMonth()+1).padStart(2,'0')}`};};
const select=`SELECT t.*,w.name AS wallet_name,w.icon AS wallet_icon,w.color AS wallet_color,c.name AS category_name,c.icon AS category_icon,c.color AS category_color FROM transactions t JOIN wallets w ON w.id=t.wallet_id JOIN categories c ON c.id=t.category_id`;
export async function getFinanceReport(db:SQLiteDatabase,period:string):Promise<FinanceReport>{
 if(!validPeriod(period))throw new Error('Periode laporan tidak valid.');const {start,end,previous}=periodBounds(period);const prev=periodBounds(previous);
 const [previousTotals,totals,days,expensesByCategory,transactions]=await Promise.all([
  db.getFirstAsync<{expense:number}>("SELECT COALESCE(SUM(amount),0) expense FROM transactions WHERE type='expense' AND transaction_date BETWEEN ? AND ?",prev.start,prev.end),
  db.getFirstAsync<{income:number;expense:number}>("SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) income,COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) expense FROM transactions WHERE transaction_date BETWEEN ? AND ?",start,end),
  db.getAllAsync<ReportDay>("SELECT substr(transaction_date,9,2) day,COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) income,COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) expense FROM transactions WHERE transaction_date BETWEEN ? AND ? GROUP BY day ORDER BY day",start,end),
  db.getAllAsync<ReportCategory>("SELECT c.id category_id,c.name,c.icon,COALESCE(SUM(t.amount),0) amount,COUNT(t.id) count FROM categories c LEFT JOIN transactions t ON t.category_id=c.id AND t.type='expense' AND t.transaction_date BETWEEN ? AND ? WHERE c.type='expense' GROUP BY c.id HAVING amount>0 ORDER BY amount DESC",start,end),
  db.getAllAsync<Transaction>(`${select} WHERE t.transaction_date BETWEEN ? AND ? ORDER BY t.transaction_date DESC,t.id DESC`,start,end),
 ]);
 return{period,income:totals?.income??0,expense:totals?.expense??0,previousExpense:previousTotals?.expense??0,net:(totals?.income??0)-(totals?.expense??0),days,expensesByCategory,transactions};
}
export type Insight = { id:string; title:string; detail:string; tone:'positive'|'neutral'|'warning' };
export async function getFinanceInsights(db:SQLiteDatabase,period:string):Promise<Insight[]>{
 if(!validPeriod(period))throw new Error('Periode insight tidak valid.');const {start,end,previous}=periodBounds(period);const prev=periodBounds(previous);
 const [current,prior,best,overspent,counts]=await Promise.all([
  db.getFirstAsync<{income:number;expense:number}>("SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) income,COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) expense FROM transactions WHERE transaction_date BETWEEN ? AND ?",start,end),
  db.getFirstAsync<{expense:number}>("SELECT COALESCE(SUM(amount),0) expense FROM transactions WHERE type='expense' AND transaction_date BETWEEN ? AND ?",prev.start,prev.end),
  db.getFirstAsync<{name:string;amount:number;count:number}>("SELECT c.name,SUM(t.amount) amount,COUNT(*) count FROM transactions t JOIN categories c ON c.id=t.category_id WHERE t.type='expense' AND t.transaction_date BETWEEN ? AND ? GROUP BY c.id ORDER BY amount DESC LIMIT 1",start,end),
  db.getFirstAsync<{name:string;amount:number;spent:number}>("SELECT c.name,b.amount,COALESCE(SUM(t.amount),0) spent FROM budgets b JOIN categories c ON c.id=b.category_id LEFT JOIN transactions t ON t.category_id=b.category_id AND t.type='expense' AND substr(t.transaction_date,1,7)=b.period WHERE b.period=? GROUP BY b.id HAVING spent>b.amount ORDER BY (spent-b.amount) DESC LIMIT 1",period),
  db.getFirstAsync<{count:number}>("SELECT COUNT(*) count FROM transactions WHERE transaction_date BETWEEN ? AND ?",start,end),
 ]);
 const insights:Insight[]=[];if(best)insights.push({id:'top-category',title:`Pengeluaran terbesar: ${best.name}`,detail:`${best.count} transaksi berjumlah Rp${best.amount.toLocaleString('id-ID')} pada ${period}.`,tone:'neutral'});
 if(current?.expense){const delta=current.expense-(prior?.expense??0);if(!prior?.expense)insights.push({id:'compare',title:'Belum ada pembanding bulan lalu',detail:`Pengeluaran bulan ini tercatat Rp${current.expense.toLocaleString('id-ID')}.`,tone:'neutral'});else insights.push({id:'compare',title:delta<=0?'Pengeluaran menurun':'Pengeluaran meningkat',detail:`${Math.abs(Math.round(delta/prior.expense*100))}% dibanding bulan sebelumnya (${delta<=0?'lebih rendah':'lebih tinggi'} Rp${Math.abs(delta).toLocaleString('id-ID')}).`,tone:delta<=0?'positive':'warning'});}
 if(overspent)insights.push({id:'budget',title:`Anggaran ${overspent.name} terlampaui`,detail:`Realisasi Rp${overspent.spent.toLocaleString('id-ID')} dari batas Rp${overspent.amount.toLocaleString('id-ID')}.`,tone:'warning'});
 if(current?.income && current.income>current.expense)insights.push({id:'net-positive',title:'Arus kas bulan ini positif',detail:`Pemasukan melebihi pengeluaran sebesar Rp${(current.income-current.expense).toLocaleString('id-ID')}.`,tone:'positive'});
 if(!counts?.count)insights.push({id:'empty',title:'Belum ada data periode ini',detail:'Catat transaksi untuk melihat ringkasan dan insight keuangan.',tone:'neutral'});
 return insights;
}
export async function getAllTransactionsForExport(db:SQLiteDatabase){return db.getAllAsync<Pick<Transaction,'transaction_date'|'type'|'category_name'|'wallet_name'|'amount'|'note'|'id'>>(`${select} ORDER BY t.transaction_date,t.id`);}
export function transactionsToCSV(rows:Awaited<ReturnType<typeof getAllTransactionsForExport>>){const quote=(v:string|number)=>`"${String(v).replaceAll('"','""')}"`;const lines=[['ID','Tanggal','Jenis','Kategori','Kantong','Nominal (Rp)','Catatan'],...rows.map(r=>[r.id,r.transaction_date,r.type==='income'?'Pemasukan':'Pengeluaran',r.category_name,r.wallet_name,r.amount,r.note])];return'\uFEFF'+lines.map(row=>row.map(quote).join(',')).join('\r\n');}
