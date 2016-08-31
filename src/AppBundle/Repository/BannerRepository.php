<?php
namespace AppBundle\Repository;
use AppBundle\Helper\App;
use Doctrine\ORM\EntityRepository;

/**
 * class: BannerRepository
 * -----------------------------------------------------
 * Created by MihailShirnin on 31.08.2016.
 */

class BannerRepository  extends EntityRepository
{

	public function Fopo () {
		App::dump(111111111);
	}

}

