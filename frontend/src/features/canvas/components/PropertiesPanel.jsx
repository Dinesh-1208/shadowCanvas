import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LogoutButton from '../../auth/components/LogoutButton';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Slider } from '../../../components/ui/slider';
import { Separator } from '../../../components/ui/separator';
import { Trash2, Type, Move, Layers } from 'lucide-react';

export default function PropertiesPanel({ canvas }) {
    const {
        selectedId, elements,
        strokeColor, setStrokeColor,
        fillColor, setFillColor,
        strokeWidth, setStrokeWidth,
        opacity, setOpacity,
        fontSize, setFontSize,
        fontFamily, setFontFamily,
        deleteElement
    } = canvas;

    const selectedElement = selectedId ? elements.find(el => el.id === selectedId) : null;
    const isSelected = !!selectedElement;

    return (
        <AnimatePresence mode="wait">
            {!isSelected ? (
                <motion.div
                    key="empty"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white/80 backdrop-blur-xl border border-white/20 p-4 rounded-2xl flex flex-col gap-4 shadow-2xl cursor-default ring-1 ring-black/5"
                >
                    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                        <Layers className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold tracking-wide">Canvas Settings</span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Zoom</span>
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                                {Math.round(canvas.zoom * 100)}%
                            </span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Background</span>
                            <div className="h-4 w-4 rounded-full border border-border bg-white shadow-sm" />
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Grid</span>
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded">Active</span>
                        </div>

                        <Separator />

                        <div className="pt-2">
                            <LogoutButton className="btn-danger-sm" />
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    key={selectedId} // Animate when selection changes
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white/80 backdrop-blur-xl border border-white/20 p-4 rounded-2xl flex flex-col gap-5 shadow-2xl cursor-default ring-1 ring-black/5"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                            {selectedElement.type}
                        </span>
                        <Button
                            variant="ghost"
                            size="iconSm"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteElement(selectedId)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <Separator />

                    {/* Layout */}
                    <Section title="Position & Size" icon={Move}>
                        <div className="grid grid-cols-2 gap-2">
                            <PropInput label="X" value={Math.round(selectedElement.x)} readOnly />
                            <PropInput label="Y" value={Math.round(selectedElement.y)} readOnly />
                            <PropInput label="W" value={Math.round(selectedElement.width || 0)} readOnly />
                            <PropInput label="H" value={Math.round(selectedElement.height || 0)} readOnly />
                        </div>
                    </Section>

                    <Separator />

                    {/* Appearance */}
                    <Section title="Appearance">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label>Opacity</Label>
                                <span className="text-xs text-muted-foreground">{opacity}%</span>
                            </div>
                            <Slider
                                min={0} max={100} step={1}
                                value={opacity}
                                onChange={(e) => setOpacity(Number(e.target.value))}
                            />
                        </div>
                    </Section>

                    <Separator />

                    {/* Stroke */}
                    <Section title="Stroke">
                        <div className="space-y-3">
                            <ColorPicker value={strokeColor} onChange={setStrokeColor} />
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-xs">Width</Label>
                                    <span className="text-xs text-muted-foreground">{strokeWidth}px</span>
                                </div>
                                <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
                                    {[1, 2, 4, 6].map(w => (
                                        <button
                                            key={w}
                                            onClick={() => setStrokeWidth(w)}
                                            className={`flex-1 h-6 rounded text-xs font-medium transition-colors ${strokeWidth === w ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}
                                        >
                                            {w}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Fill - Only for shapes */}
                    {['rect', 'circle', 'diamond'].includes(selectedElement.type) && (
                        <>
                            <Separator />
                            <Section title="Fill">
                                <ColorPicker value={fillColor} onChange={setFillColor} allowNone />
                            </Section>
                        </>
                    )}

                    {/* Text Settings */}
                    {selectedElement.type === 'text' && (
                        <>
                            <Separator />
                            <Section title="Typography" icon={Type}>
                                <div className="space-y-3">
                                    <select
                                        value={fontFamily}
                                        onChange={(e) => setFontFamily(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        <option value="normal">Sans-serif</option>
                                        <option value="handwriting">Handwriting</option>
                                        <option value="code">Monospace</option>
                                    </select>

                                    <div className="flex items-center gap-3">
                                        <Label className="w-12">Size</Label>
                                        <Input
                                            type="number"
                                            value={fontSize}
                                            onChange={(e) => setFontSize(Number(e.target.value))}
                                            className="h-8"
                                        />
                                    </div>
                                </div>
                            </Section>
                        </>
                    )}

                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── Sub-components ───

function Section({ title, icon: Icon, children }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
                {Icon && <Icon className="h-3 w-3" />}
                <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
            </div>
            {children}
        </div>
    );
}

function PropInput({ label, value, readOnly }) {
    return (
        <div className="flex items-center gap-2 relative">
            <span className="absolute left-2 text-[10px] text-muted-foreground font-bold">{label}</span>
            <Input
                readOnly={readOnly}
                value={value}
                className="h-8 pl-6 text-right font-mono text-xs bg-muted/30 border-transparent focus:border-input focus:bg-background"
            />
        </div>
    );
}

function ColorPicker({ value, onChange, allowNone }) {
    const colors = [
        '#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6',
        '#6366F1', '#8B5CF6', '#EC4899', '#000000', '#FFFFFF'
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {allowNone && (
                <button
                    onClick={() => onChange('none')}
                    title="No Color"
                    className={`w-6 h-6 rounded-full border border-input relative overflow-hidden transition-transform hover:scale-110 ${value === 'none' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white via-red-500 to-white" style={{ background: 'linear-gradient(to bottom right, #fff 45%, #f00 46%, #f00 54%, #fff 55%)' }}></div>
                </button>
            )}
            {colors.map(c => (
                <button
                    key={c}
                    onClick={() => onChange(c)}
                    className={`w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-110 ${value === c ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    style={{ backgroundColor: c }}
                />
            ))}
            <label className="w-6 h-6 rounded-full border border-input overflow-hidden relative cursor-pointer hover:scale-110 transition-transform">
                <div className="absolute inset-0 bg-[conic-gradient(at_center,_var(--tw-gradient-stops))] from-red-500 via-purple-500 to-blue-500 opacity-80" />
                <input
                    type="color"
                    value={value === 'none' ? '#ffffff' : value}
                    onChange={(e) => onChange(e.target.value)}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
            </label>
        </div>
    );
}
