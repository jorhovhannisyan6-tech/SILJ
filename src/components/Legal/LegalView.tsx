import {
  BookOpen,
  Scale,
  Shield,
  Layers,
  FileCheck2,
  Building,
  CheckCircle2,
  Info,
  Phone,
  MapPin,
  Clock,
  Mail,
  Globe,
  Award,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export function LegalView() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#00235B] via-[#002D72] to-[#003399] text-white rounded-2xl p-6 shadow-lg shadow-blue-950/20 border border-blue-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#0066FF] flex items-center justify-center text-white flex-shrink-0 shadow-md">
              <Scale className="w-6 h-6 text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold">
                  «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» Պաշտոնական Տեղեկատվություն & Կանոնակարգեր
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-blue-200 mt-0.5">
                ՀՀ Օրենսդրություն, ՀՀ ԿԲ նորմատիվներ, 13 բաժինների գույքային ստանդարտներ և մասնաճյուղային ցանց
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="bg-white/10 text-cyan-200 border border-white/20 text-xs px-3 py-1.5 rounded-xl font-medium inline-flex items-center gap-1.5 backdrop-blur-xs">
              <Award className="w-3.5 h-3.5 text-cyan-300" />
              ՀՀ ԿԲ Լիցենզիա թիվ 0004 (0033)
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Main Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: 13 Բաժինների Ստանդարտ */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <Layers className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Գույքի Ապահովագրության 13 Բաժինների Կառուցվածք
            </h3>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-blue-900 block">I. Ընկերության տվյալներ</span>
              Անվանում, ՀՎՀՀ, գործունեության տեսակ, կոնտակտային տվյալներ
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-blue-900 block">II. Ապահովագրվող օբյեկտի տվյալներ</span>
              Հասցե, հարկայնություն, շինության նյութ, մակերես, կառուցման տարեթիվ
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-blue-900 block">III. Ապահովագրվող գույք</span>
              Շինություն, հարդարում, հաստոցներ, տեխնիկա, պաշարներ, ցուցանակներ, ապակիներ
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-blue-900 block">IV. Գույքի արժեքներ</span>
              Շուկայական/հաշվեկշռային արժեքներ, ապահովագրական գումարի ձևավորում
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-blue-900 block">V. Ապրանքների տեղեկատվություն</span>
              Միջին/առավելագույն մնացորդ, տարեկան շրջանառություն, հատուկ պահպանման նյութեր
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-blue-900 block">VI. Շենքի շահագործման պայմաններ</span>
              Պահեստ, նկուղ, պահման ձևը (դարակաշար, պալետ, հատակ, բարձրություն հատակից)
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-blue-900 block">VII. Կոմունալ համակարգեր</span>
              Էլեկտրամատակարարում (220V/380V), գազ, ջուր, ջեռուցում, օդափոխություն
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-blue-900 block">VIII. Հակահրդեհային պաշտպանություն</span>
              Ազդարարում, ավտոմատ հրդեհաշիջում, ծխի դետեկտորներ, կրակմարիչներ
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-blue-900 block">IX. Անվտանգության միջոցներ</span>
              Տեսահսկում, ազդանշանային համակարգ, ֆիզիկական պահպանություն, ճաղավանդակներ
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-blue-900 block">X. Վնասների պատմություն</span>
              Վերջին 5 տարվա ընթացքում արձանագրված պատահարներ և կորուստներ
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-blue-900 block">XI. Ապահովագրական ծածկույթ / Ռիսկեր</span>
              FLEXA (հրդեհ, պայթյուն), ջրի արտահոսք, բնական աղետներ, գողություն, վանդալիզմ
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-blue-900 block">XII. Կից փաստաթղթեր</span>
              Վկայական, պայմանագիր, գույքացուցակ, հատակագիծ, լուսանկարներ
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-blue-900 block">XIII. Շահառուի տվյալներ</span>
              Կամավոր թե գրավադրված, Բանկի տվյալներ, Շահառուի ով լինելը
            </div>
          </div>
        </div>

        {/* Right Column: Mortgage Rules & Official Company Requisites */}
        <div className="space-y-6">
          {/* Card 2: Հիփոթեքային Փաթեթներ & Կանխավճարի ապահովագրություն */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-base">
                Հիփոթեքային և Կանխավճարի Ապահովագրություն
              </h3>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-blue-950 text-sm">
                    ՓԱԹԵԹ I (ԱՀԸ Ստանդարտ)
                  </span>
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    ԱՀԸ
                  </span>
                </div>
                <p className="mt-1 text-slate-700 leading-relaxed">
                  «Ազգային Հիփոթեքային Ընկերություն» ՈՒՎԿ-ի պահանջներով՝ Ապահովագրական գումարը սահմանվում է <strong>ՉԿԳ մայր գումարի մնացորդի + մինչև 2 տարվա հաշվարկված տոկոսների</strong> գումարի չափով:
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-sm">
                    ՓԱԹԵԹ II (ԲԵ Ստանդարտ)
                  </span>
                  <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    ԲԵ
                  </span>
                </div>
                <p className="mt-1 text-slate-700 leading-relaxed">
                  «Բնակարան Երիտասարդներին» ՈՒՎԿ-ի պահանջներով՝ Ապահովագրական գումարը սահմանվում է խստորեն հավասար <strong>միայն ՉԿԳ մայր գումարի մնացորդին</strong>:
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="font-bold text-emerald-950 text-xs block mb-1">
                  💡 Կանխավճարի Ապահովագրություն (10% Կանխավճարով)
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Հնարավորություն է տալիս բնակարան ձեռք բերել ընդամենը 10% կանխավճարով՝ պահանջվող 20-30%-ի փոխարեն: Գործում է նաև ՀՀ եկամտահարկի վերադարձի պետական ծրագիրը:
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Պաշտոնական Ռեկվիզիտներ & Մասնաճյուղեր */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <Building className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-base">
                «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Ռեկվիզիտներ & Կապ
              </h3>
            </div>

            <div className="text-xs space-y-2.5 text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Լրիվ անվանում՝</span>
                <span className="font-bold text-slate-900">«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Հիմնադրում & Փորձ՝</span>
                <span className="font-semibold text-slate-900">2000թ․ (25+ տարվա փորձ)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">ՀՀ ԿԲ Լիցենզիա՝</span>
                <span className="font-semibold text-blue-900">Ոչ կյանքի ապահովագրության N 0004 (0033)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Գլխամասային հասցե՝</span>
                <span className="font-medium text-slate-900">ՀՀ, ք․ Երևան 0010, Արամի 3 և 5</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Շուրջօրյա շտապ կապ (24/7)՝</span>
                <span className="font-bold text-blue-600">81-00 կամ (+374 60) 54-00-00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Քաղաքային հեռախոսներ՝</span>
                <span className="font-medium text-slate-900">(+374 10) 58-00-00, (+374 60) 54-00-00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Էլ․ փոստ՝</span>
                <span className="font-medium text-slate-900">info@silinsurance.am</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Պաշտոնական կայք՝</span>
                <a
                  href="https://silinsurance.am"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  www.silinsurance.am
                </a>
              </div>
            </div>

            {/* Regional Branches */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="font-bold text-slate-900 text-xs block mb-2">
                Մարզային Մասնաճյուղեր (09:00 - 18:00)․
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="font-bold text-slate-800 block">ք. Գյումրի</span>
                  <span className="text-slate-600">Գորկու 87</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="font-bold text-slate-800 block">ք. Արարատ</span>
                  <span className="text-slate-600">Շահումյան 20/1</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="font-bold text-slate-800 block">ք. Իջևան</span>
                  <span className="text-slate-600">Ա. Մելիքբեկյան 1/1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

