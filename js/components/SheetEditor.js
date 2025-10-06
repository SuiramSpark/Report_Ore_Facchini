{/* Firma Responsabile */}
                    <div className="mb-6">
                        <h3 className="text-xl font-bold mb-4">✍️ Firma Responsabile</h3>
                        
                        {currentSheet.firmaResponsabile ? (
                            <div>
                                <img 
                                    src={currentSheet.firmaResponsabile} 
                                    alt="Firma Responsabile" 
                                    className="border-2 border-green-500 rounded-lg mb-3 p-2 bg-white max-w-md" 
                                />
                                <button
                                    onClick={() => {
                                        if (confirm('Cancellare la firma?')) {
                                            setCurrentSheet({...currentSheet, firmaResponsabile: null});
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    🗑️ Cancella Firma
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="border-2 border-indigo-500 rounded-lg p-2 bg-white mb-3">
                                    <canvas 
                                        ref={respCanvasRef} 
                                        width={800} 
                                        height={300} 
                                        className="signature-canvas"
                                        style={{ 
                                            touchAction: 'none',
                                            maxWidth: '100%',
                                            aspectRatio: '8/3'
                                        }}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={saveResponsabileSignature}
                                        disabled={loading}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
                                    >
                                        ✓ Salva Firma
                                    </button>
                                    <button
                                        onClick={() => clearCanvas(respCanvasRef.current)}
                                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                    >
                                        🗑️ Cancella
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
