import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Upload, X, Check, Image as ImageIcon, ZoomIn } from "lucide-react";
import getCroppedImg from "@/lib/canvasUtils";
import { toast } from "sonner";

interface AvatarUploadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (blob: Blob) => void;
    isUploading?: boolean;
}

export function AvatarUploadDialog({ isOpen, onClose, onUpload, isUploading }: AvatarUploadDialogProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setImageSrc(reader.result as string);
            });
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImageBlob) {
                onUpload(croppedImageBlob);
                handleClose();
            }
        } catch (e) {
            console.error(e);
            toast.error("Erro ao cortar imagem.");
        }
    };

    const handleClose = () => {
        setImageSrc(null);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-primary/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-display">
                        <ImageIcon className="w-5 h-5 text-primary" />
                        Editar Avatar
                    </DialogTitle>
                </DialogHeader>

                {!imageSrc ? (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-xl p-10 hover:border-primary/60 transition-colors bg-primary/5 cursor-pointer relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-12 h-12 text-primary mb-3" />
                        <p className="text-sm font-medium text-foreground">Clique para selecionar</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG (Max 5MB)</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden border border-border">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                showGrid={false}
                                cropShape="round"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><ZoomIn className="w-3 h-3" /> Zoom</span>
                                <span>{(zoom - 1).toFixed(1)}x</span>
                            </div>
                            <Slider
                                value={[zoom]}
                                min={1}
                                max={3}
                                step={0.1}
                                onValueChange={(v) => setZoom(v[0])}
                                className="w-full"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={() => setImageSrc(null)} className="flex-1">
                                <X className="w-4 h-4 mr-2" /> Cancelar
                            </Button>
                            <Button onClick={handleSave} disabled={isUploading} className="flex-1 bg-gradient-to-r from-primary to-purple-600">
                                {isUploading ? "Salvando..." : <><Check className="w-4 h-4 mr-2" /> Salvar</>}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
