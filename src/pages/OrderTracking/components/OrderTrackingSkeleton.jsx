/**
 * Skeleton loader para a tela de acompanhamento de pedido.
 * Exibido enquanto o WebSocket handshake e estado inicial são carregados.
 */
export default function OrderTrackingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9ECE5] via-white to-[#F9ECE5] font-[Poppins]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-pulse">
        {/* Header skeleton */}
        <div className="text-center mb-10">
          <div className="h-4 w-40 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="h-8 w-64 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="h-5 w-48 bg-gray-200 rounded-full mx-auto" />
        </div>

        {/* Estimated time card skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
            <div>
              <div className="h-3 w-32 bg-gray-200 rounded-full mb-2" />
              <div className="h-8 w-28 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>

        {/* Progress bar skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="h-3 w-32 bg-gray-200 rounded-full mb-5" />
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 bg-gray-200 rounded-full mb-2" />
                <div className="h-3 w-14 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Items list skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="h-3 w-28 bg-gray-200 rounded-full mb-5" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded-full mb-1.5" />
                    <div className="h-3 w-24 bg-gray-200 rounded-full" />
                  </div>
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
