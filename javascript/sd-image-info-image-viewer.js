onUiLoaded(function () {
  let imgInfoImage = document.getElementById("imgInfoImage");
  let img = imgInfoImage.querySelector('img');

  if (img) {
    img.addEventListener('click', () => {
      const imgBox = document.createElement('div');
      imgBox.id = 'imgInfoZoom';
      imgBox.setAttribute('tabindex', '0');
      document.body.style.overflow = 'hidden';

      Object.assign(imgBox.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '9999',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)'
      });

      const imgEL = img.cloneNode();

      Object.assign(imgEL.style, {
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        cursor: 'auto',
        opacity: '0',
        transition: 'transform 0.3s ease, opacity 0.6s ease',
        transform: 'translate(0px, 0px) scale(0)'
      });

      imgBox.appendChild(imgEL);
      document.body.appendChild(imgBox);
      imgBox.focus();

      let scale = 1;
      let offsetX = 0;
      let offsetY = 0;
      let lastX = 0;
      let lastY = 0;
      let lastLen = 1;
      let GropinTime = null;
      let Groped = false;
      let velocityX = 0;
      let velocityY = 0;
      let LastTouch = 0;
      let ZoomMomentum = 0;
      let LastZoom = 0;
      let MultiGrope = false;
      let SnapMeter = 20;

      imgEL.onload = function() {
        imgEL.style.opacity = '1';
        imgEL.style.transform = 'translate(0px, 0px) scale(1)';
      };

      imgEL.addEventListener('wheel', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const currentTime = Date.now();
        const timeDelta = currentTime - LastZoom;
        LastZoom = currentTime;
        const centerX = imgBox.offsetWidth / 2;
        const centerY = imgBox.offsetHeight / 2;
        const delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));
        const zoomStep = 0.15;
        const zoom = 1 + delta * zoomStep;
        const lastScale = scale;
        scale *= zoom;
        scale = Math.max(1, Math.min(scale, 10));
        ZoomMomentum = delta / (timeDelta * 0.5 || 1);
        ZoomMomentum = Math.min(Math.max(ZoomMomentum, -1.5), 1.5);

        const imgELW = imgEL.offsetWidth * scale;
        const imgELH = imgEL.offsetHeight * scale;
        const imgBoxW = imgBox.offsetWidth;
        const imgBoxH = imgBox.offsetHeight;

        if (scale <= 1) {
          offsetX = 0;
          offsetY = 0;
        } else if (imgELW <= imgBoxW) {
          const imgCenterY = offsetY + centerY;
          offsetX = 0;
          offsetY = e.clientY - ((e.clientY - imgCenterY) / lastScale) * scale - centerY;

          const EdgeY = (imgELH - imgBoxH) / 2;
          if (offsetY > EdgeY) {
            offsetY = EdgeY;
          } else if (offsetY < -EdgeY) {
            offsetY = -EdgeY;
          }
        } else {
          const imgCenterX = offsetX + centerX;
          const imgCenterY = offsetY + centerY;
          offsetX = e.clientX - ((e.clientX - imgCenterX) / lastScale) * scale - centerX;
          offsetY = e.clientY - ((e.clientY - imgCenterY) / lastScale) * scale - centerY;

          const EdgeX = (imgELW - imgBoxW) / 2;
          if (offsetX > EdgeX) {
            offsetX = EdgeX;
          } else if (offsetX < -EdgeX) {
            offsetX = -EdgeX;
          }

          const EdgeY = (imgELH - imgBoxH) / 2;
          if (offsetY > EdgeY) {
            offsetY = EdgeY;
          } else if (offsetY < -EdgeY) {
            offsetY = -EdgeY;
          }
        }

        const momentumFactor = Math.abs(ZoomMomentum);
        const ZoomTransition = `transform ${0.4 * (1 + momentumFactor)}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
        imgEL.style.transition = ZoomTransition;
        imgEL.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        ZoomMomentum *= 0.5;
      }, { passive: false });

      imgEL.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        GropinTime = setTimeout(() => {
          Groped = true;
          imgEL.style.transition = 'transform 0s ease';
          imgEL.style.cursor = 'grab';
          lastX = e.clientX - offsetX;
          lastY = e.clientY - offsetY;
        }, 100);
      });

      imgEL.addEventListener('mousemove', (e) => {
        if (!Groped) return;
        e.preventDefault();
        imgEL.onclick = (e) => e.stopPropagation();
        imgBox.onclick = (e) => e.stopPropagation();

        const imgELW = imgEL.offsetWidth * scale;
        const imgELH = imgEL.offsetHeight * scale;
        const imgBoxW = imgBox.offsetWidth;
        const imgBoxH = imgBox.offsetHeight;
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;

        imgEL.style.transition = 'transform 60ms ease';

        if (scale <= 1) {
          offsetX = 0;
          offsetY = 0;
          imgEL.style.transform = `translateX(0px) scale(${scale})`;
        } else if (imgELW <= imgBoxW) { 
          offsetY = deltaY;
          const EdgeY = (imgELH - imgBoxH) / 2;
          if (deltaY > EdgeY + SnapMeter) {
            offsetY = EdgeY + SnapMeter;
          } else if (deltaY < -EdgeY - SnapMeter) {
            offsetY = -EdgeY - SnapMeter;
          }

          imgEL.style.transform = `translateY(${offsetY}px) scale(${scale})`;
        } else { 
          offsetX = deltaX;
          offsetY = deltaY;

          const EdgeX = (imgELW - imgBoxW) / 2;
          if (deltaX > EdgeX + SnapMeter) {
            offsetX = EdgeX + SnapMeter;
          } else if (deltaX < -EdgeX - SnapMeter) {
            offsetX = -EdgeX - SnapMeter;
          }

          const EdgeY = (imgELH - imgBoxH) / 2;
          if (deltaY > EdgeY + SnapMeter) {
            offsetY = EdgeY + SnapMeter;
          } else if (deltaY < -EdgeY - SnapMeter) {
            offsetY = -EdgeY - SnapMeter;
          }

          imgEL.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        }
      });

      const imgInfoMouseUp = (e) => {
        clearTimeout(GropinTime);
        if (!Groped && e.button === 0) {
          imgEL.onclick = closeZoom;
          imgBox.onclick = closeZoom;
          return;
        }
        SnapBack(imgEL, imgBox);
        Groped = false;
        imgEL.style.cursor = 'auto';
        setTimeout(() => {
          imgEL.style.transition = 'transform 0s ease';
        }, 100);
      };

      const imgInfoMouseLeave = (e) => {
        if (e.target !== imgEL && Groped) {
          SnapBack(imgEL, imgBox);
          Groped = false;
          imgEL.style.cursor = 'auto';
        }
      };

      imgBox.onkeydown = (e) => {
        if (!Groped && e.target === imgBox && e.key === 'Escape') {
          closeZoom();
        }
      };

      function SnapBack(imgEL, imgBox) {
        if (scale <= 1) return;

        const imgELW = imgEL.offsetWidth * scale;
        const imgELH = imgEL.offsetHeight * scale;
        const imgBoxW = imgBox.offsetWidth;
        const imgBoxH = imgBox.offsetHeight;

        if (imgELW <= imgBoxW) {
          const EdgeY = (imgELH - imgBoxH) / 2;
          if (offsetY > EdgeY) {
            offsetY = EdgeY;
          } else if (offsetY < -EdgeY) {
            offsetY = -EdgeY;
          }

          imgEL.style.transition = 'transform 0.3s ease';
          imgEL.style.transform = `translateY(${offsetY}px) scale(${scale})`;

        } else {
          const EdgeX = (imgELW - imgBoxW) / 2;
          if (offsetX > EdgeX) {
            offsetX = EdgeX;
          } else if (offsetX < -EdgeX) {
            offsetX = -EdgeX;
          }

          const EdgeY = (imgELH - imgBoxH) / 2;
          if (offsetY > EdgeY) {
            offsetY = EdgeY;
          } else if (offsetY < -EdgeY) {
            offsetY = -EdgeY;
          }

          imgEL.style.transition = 'transform 0.3s ease';
          imgEL.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        }
      }

      const TouchGrass = {
        touchScale: false,
        last1X: 0,
        last1Y: 0,
        last2X: 0,
        last2Y: 0,
        delta1X: 0,
        delta1Y: 0,
        delta2X: 0,
        delta2Y: 0,
        scale: 1
      };

      imgEL.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        imgEL.style.transition = 'none';
        velocityX = 0; 
        velocityY = 0;

        if (e.targetTouches[1]) {
          MultiGrope = true;
          TouchGrass.touchScale = true;
          TouchGrass.last1X = e.targetTouches[0].clientX;
          TouchGrass.last1Y = e.targetTouches[0].clientY;
          TouchGrass.last2X = e.targetTouches[1].clientX;
          TouchGrass.last2Y = e.targetTouches[1].clientY;
          TouchGrass.scale = scale;
          lastLen = Math.sqrt(
            Math.pow(TouchGrass.last2X - TouchGrass.last1X, 2) +
            Math.pow(TouchGrass.last2Y - TouchGrass.last1Y, 2)
          );
        } else {
          MultiGrope = false;
          
          if (!TouchGrass.touchScale) {
            lastX = e.targetTouches[0].clientX;
            lastY = e.targetTouches[0].clientY;
            LastTouch = Date.now();
          }
        }
      });

      imgBox.addEventListener('touchmove', (e) => {
        if (e.target !== imgEL) e.stopPropagation(), e.preventDefault();
      });

      imgEL.addEventListener('touchmove', (e) => {
        e.stopPropagation();
        e.preventDefault();
        imgEL.onclick = (e) => e.stopPropagation();
        imgEL.style.transition = 'none';

        if (e.targetTouches[1]) {
          TouchGrass.delta1X = e.targetTouches[0].clientX;
          TouchGrass.delta1Y = e.targetTouches[0].clientY;
          TouchGrass.delta2X = e.targetTouches[1].clientX;
          TouchGrass.delta2Y = e.targetTouches[1].clientY;
          let centerX = imgBox.offsetWidth / 2;
          let centerY = imgBox.offsetHeight / 2;
          let deltaLen = Math.sqrt(
            Math.pow(TouchGrass.delta2X - TouchGrass.delta1X, 2) +
            Math.pow(TouchGrass.delta2Y - TouchGrass.delta1Y, 2)
          );

          let zoom = deltaLen / lastLen;
          let lastScale = scale;
          scale = TouchGrass.scale * zoom;
          scale = Math.max(0.1, scale);
          scale = Math.min(scale, 10);
          let deltaCenterX = TouchGrass.delta1X + (TouchGrass.delta2X - TouchGrass.delta1X) / 2;
          let deltaCenterY = TouchGrass.delta1Y + (TouchGrass.delta2Y - TouchGrass.delta1Y) / 2;
          let imgCenterX = offsetX + centerX;
          let imgCenterY = offsetY + centerY;
          offsetX = deltaCenterX - ((deltaCenterX - imgCenterX) / lastScale) * scale - centerX;
          offsetY = deltaCenterY - ((deltaCenterY - imgCenterY) / lastScale) * scale - centerY;
          imgEL.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;

        } else if (!TouchGrass.touchScale) {
          let now = Date.now();
          let currentX = e.targetTouches[0].clientX;
          let currentY = e.targetTouches[0].clientY;
          let deltaX = currentX - lastX;
          let deltaY = currentY - lastY;
          let timeDelta = now - LastTouch;

          velocityX = deltaX / timeDelta;
          velocityY = deltaY / timeDelta;
          offsetX += deltaX;
          offsetY += deltaY;
          lastX = currentX;
          lastY = currentY;
          LastTouch = now;

          imgEL.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        }
      });

      imgEL.addEventListener('touchcancel', (e) => {
        e.stopPropagation();
        e.preventDefault();
        imgEL.onclick = undefined;
        imgEL.style.transition = 'none';
        imgEL.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        MultiGrope = false;
        TouchGrass.touchScale = false;
      });

      imgEL.addEventListener('touchend', (e) => {
        e.stopPropagation();
        imgEL.onclick = undefined;
        imgEL.style.transition = 'none';

        if (e.targetTouches.length === 0) {
          if (MultiGrope) {
            MultiGrope = false;
            TouchGrass.touchScale = false;
          } else {
            if (!TouchGrass.touchScale && (Math.abs(velocityX) > 0.05 || Math.abs(velocityY) > 0.05)) {
              function TouchMomentum() {
                let momentumDecay = 0.95;
                let momentumMultiplier = 15;
                let momentumThreshold = 0.05;
                
                if (Math.abs(velocityX) > momentumThreshold || Math.abs(velocityY) > momentumThreshold) {
                  offsetX += velocityX * momentumMultiplier;
                  offsetY += velocityY * momentumMultiplier;
                  velocityX *= momentumDecay;
                  velocityY *= momentumDecay;
                  imgEL.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
                  requestAnimationFrame(TouchMomentum);
                } else {
                  velocityX = 0; 
                  velocityY = 0; 
                }
              }

              TouchMomentum();
            }
          }

          setTimeout(() => {
            TouchGrass.touchScale = false;
          }, 10);
        }
      });

      function closeZoom() {
        imgEL.style.transition = 'transform 0.8s ease, opacity 0.4s ease';
        imgEL.style.opacity = '0';
        imgEL.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(0)`;

        setTimeout(() => {
          imgBox.remove();
          document.body.style.overflow = 'auto';
          document.removeEventListener('mouseleave', imgInfoMouseLeave);
          document.removeEventListener('mouseup', imgInfoMouseUp);
        }, 200);
      }

      document.addEventListener('mouseleave', imgInfoMouseLeave);
      document.addEventListener('mouseup', imgInfoMouseUp);
    });
  }
});
