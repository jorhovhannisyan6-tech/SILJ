import { Component, type ErrorInfo, type ReactNode } from "react";

export class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  state = { hasError: false, message: "" };
  static getDerivedStateFromError(error: Error) { return { hasError: true, message: error?.message || "Անսպասելի սխալ" }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("SIL Insurance UI error", error, info);
    try { localStorage.setItem("sil-last-ui-error", JSON.stringify({ at: new Date().toISOString(), message: error.message, stack: error.stack })); } catch {}
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6"><div className="max-w-lg w-full bg-white border border-red-200 rounded-2xl p-7 shadow-lg"><h1 className="text-xl font-black text-slate-900">Համակարգի ինտերֆեյսում սխալ առաջացավ</h1><p className="mt-2 text-sm text-slate-600">Տվյալների հաշվարկային կանոնները չեն փոխվել։ Փորձեք վերաբեռնել էջը։ Եթե խնդիրը կրկնվի, Admin բաժնում պահված վերջին սխալի տվյալները կարող են օգնել տեխնիկական ստուգմանը։</p><details className="mt-4 text-xs text-red-700"><summary className="cursor-pointer font-bold">Տեխնիկական մանրամասներ</summary><pre className="mt-2 whitespace-pre-wrap">{this.state.message}</pre></details><button className="mt-5 px-4 py-2.5 rounded-xl bg-[#075bd5] text-white font-bold" onClick={() => location.reload()}>Վերաբեռնել</button></div></div>;
  }
}
